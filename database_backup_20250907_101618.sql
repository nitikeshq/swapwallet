--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_settings OWNER TO neondb_owner;

--
-- Name: price_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.price_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token_pair text NOT NULL,
    price numeric(18,8) NOT NULL,
    volume_24h numeric(18,8),
    liquidity numeric(18,8),
    source text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.price_history OWNER TO neondb_owner;

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referrals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    referrer_address text NOT NULL,
    referee_address text NOT NULL,
    transaction_id text NOT NULL,
    commission_amount numeric(18,8) NOT NULL,
    commission_token text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    paid_at timestamp without time zone
);


ALTER TABLE public.referrals OWNER TO neondb_owner;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_address text NOT NULL,
    tx_hash text NOT NULL,
    from_token text NOT NULL,
    to_token text NOT NULL,
    from_amount numeric(18,8) NOT NULL,
    to_amount numeric(18,8) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    block_number integer,
    gas_used numeric(18,8),
    gas_price numeric(18,8),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp without time zone,
    burning_fee numeric(18,8) DEFAULT '0'::numeric
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    referral_code text,
    referred_by text,
    total_earnings numeric(18,8) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    milestone_achieved boolean DEFAULT false,
    btc_bonus_claimed boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_settings (id, setting_key, setting_value, description, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.price_history (id, token_pair, price, volume_24h, liquidity, source, "timestamp") FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.referrals (id, referrer_address, referee_address, transaction_id, commission_amount, commission_token, status, created_at, paid_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, user_address, tx_hash, from_token, to_token, from_amount, to_amount, status, block_number, gas_used, gas_price, created_at, confirmed_at, burning_fee) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, wallet_address, referral_code, referred_by, total_earnings, created_at, milestone_achieved, btc_bonus_claimed) FROM stdin;
\.


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_setting_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_setting_key_unique UNIQUE (setting_key);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_tx_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_tx_hash_unique UNIQUE (tx_hash);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);


--
-- Name: users users_wallet_address_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

