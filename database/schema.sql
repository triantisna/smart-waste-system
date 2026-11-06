-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  waste_category text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'In Progress'::text, 'Completed'::text, 'Rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  confidence numeric,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);