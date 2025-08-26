CREATE OR REPLACE FUNCTION update_ln_type_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- set updated_at to current timestamp
  NEW.update_at := now();

  -- set updated_by, adjust according to how you store the user info
  -- for example, if you use current_user or pass it via application
  NEW.update_by := current_user;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- public.ln_type definition

-- Drop table

-- DROP TABLE public.ln_type;

CREATE TABLE public.ln_type (
	uid uuid DEFAULT gen_random_uuid() NOT NULL,
	incoterm varchar(5) NULL,
	business_unit varchar(20) NULL,
	type_ln varchar(3) NULL,
	create_at timestamp DEFAULT now() NULL,
	create_by varchar(100) DEFAULT 'adm'::character varying NULL,
	update_at timestamp NULL,
	update_by varchar(100) NULL,
	CONSTRAINT ln_type_pk PRIMARY KEY (uid)
);

-- Table Triggers

create trigger trg_update_ln_type_audit before
update
    on
    public.ln_type for each row execute function update_ln_type_audit();