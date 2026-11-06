from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import numpy as np
from PIL import Image
import io

# 1. Inisialisasi Aplikasi FastAPI (INI YANG SEBELUMNYA TERLEWAT)
app = FastAPI(title="Waste Classification API")

# Setup CORS agar bisa diakses dari HP & Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Bangun ulang arsitektur yang bersih di environment lokal
base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(3, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)
model.compile(optimizer=Adam(learning_rate=0.001), loss='categorical_crossentropy', metrics=['accuracy'])

# 3. Masukkan bobot murni hasil training Colab secara aman
model.load_weights('waste_weights.weights.h5')
print("Bobot murni berhasil dimuat ke model!")

CLASS_NAMES = ["Organic Waste", "Paper Waste", "Plastic Waste"]

def preprocess_image(image_bytes):
    # Ubah bytes menjadi gambar PIL
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize sesuai input MobileNetV2
    image = image.resize((224, 224))
    # Ubah ke array numpy
    img_array = np.array(image)
    # Penskalaan standar manual / 255.0 sesuai Colab
    img_array = img_array / 255.0
    # Tambahkan dimensi batch (menjadi 1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.post("/predict")
async def predict_waste(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Format gambar tidak didukung")
    
    try:
        image_bytes = await file.read()
        processed_img = preprocess_image(image_bytes)
        
        predictions = model.predict(processed_img)
        
        # Cetak raw probabilities untuk debugging akurasi model
        print("Raw Predictions Array:", predictions[0])
        
        confidence = float(np.max(predictions[0]))
        class_index = int(np.argmax(predictions[0]))
        category = CLASS_NAMES[class_index]
        
        return {
            "category": category,
            "confidence": round(confidence, 3)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Waste Classification API is running. Send POST request to /predict"}