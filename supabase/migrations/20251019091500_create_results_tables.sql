-- Migration: create results table
-- Creates a results table that references students(id) via student_id

CREATE TABLE IF NOT EXISTS public.results (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	student_id uuid NOT NULL, -- references students(id)
	btl character varying(10), -- Btl column requested
	roll_number character varying(20) NOT NULL,
	names character varying(100) NOT NULL,
	department character varying(100),
	internal character varying(10),
	c1_a_cqi character varying(10),
	c2_a_cqi character varying(10),
	pt_1 character varying(10),
	pt_2 character varying(10),
	ssa_1 character varying(10),
	ssa_2 character varying(10),
	cia_1 character varying(10),
	cia_2 character varying(10),
	formative_1 character varying(10),
	formative_2 character varying(10),
	b_cqi_i character varying(10),
	b_cqi_ii character varying(10),
	ese_marks character varying(10),
	created_at timestamp without time zone DEFAULT now(),
	CONSTRAINT results_pkey PRIMARY KEY (id),
	CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.results USING btree (student_id) TABLESPACE pg_default;

-- Optional: add a unique constraint if you want one result per student per exam
-- ALTER TABLE public.results ADD CONSTRAINT results_student_unique UNIQUE (student_id, roll_number);

