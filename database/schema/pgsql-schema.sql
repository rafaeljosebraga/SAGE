--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos (
    id bigint NOT NULL,
    espaco_id bigint NOT NULL,
    user_id bigint NOT NULL,
    titulo character varying(255) NOT NULL,
    justificativa text NOT NULL,
    data_inicio date NOT NULL,
    hora_inicio time(0) without time zone NOT NULL,
    data_fim date NOT NULL,
    hora_fim time(0) without time zone NOT NULL,
    status character varying(255) DEFAULT 'pendente'::character varying NOT NULL,
    observacoes text,
    aprovado_por bigint,
    aprovado_em timestamp(0) without time zone,
    motivo_rejeicao text,
    recorrente boolean DEFAULT false NOT NULL,
    tipo_recorrencia character varying(255),
    data_fim_recorrencia date,
    recursos_solicitados json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    color_index integer,
    grupo_recorrencia_id bigint,
    CONSTRAINT agendamentos_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'aprovado'::character varying, 'rejeitado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT agendamentos_tipo_recorrencia_check CHECK (((tipo_recorrencia)::text = ANY ((ARRAY['diaria'::character varying, 'semanal'::character varying, 'mensal'::character varying])::text[])))
);


--
-- Name: agendamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agendamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agendamentos_id_seq OWNED BY public.agendamentos.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: espaco_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.espaco_fotos (
    id bigint NOT NULL,
    espaco_id bigint NOT NULL,
    url character varying(255) NOT NULL,
    nome_original character varying(255) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    caminho character varying(255) NOT NULL,
    tamanho integer NOT NULL,
    tipo_mime character varying(255) NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    descricao text,
    created_by bigint,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: espaco_fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.espaco_fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: espaco_fotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.espaco_fotos_id_seq OWNED BY public.espaco_fotos.id;


--
-- Name: espaco_recurso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.espaco_recurso (
    id bigint NOT NULL,
    espaco_id bigint NOT NULL,
    recurso_id bigint NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    observacoes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: espaco_recurso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.espaco_recurso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: espaco_recurso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.espaco_recurso_id_seq OWNED BY public.espaco_recurso.id;


--
-- Name: espaco_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.espaco_user (
    espaco_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_by bigint,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: espacos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.espacos (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    capacidade integer NOT NULL,
    descricao text,
    localizacao_id bigint,
    recursos_fixos json,
    status character varying(255) DEFAULT 'ativo'::character varying NOT NULL,
    responsavel_id bigint,
    disponivel_reserva boolean DEFAULT true NOT NULL,
    observacoes text,
    created_by bigint,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT espacos_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'inativo'::character varying, 'manutencao'::character varying])::text[])))
);


--
-- Name: espacos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.espacos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: espacos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.espacos_id_seq OWNED BY public.espacos.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: grupos_recorrencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos_recorrencia (
    id bigint NOT NULL,
    nome_grupo character varying(255) NOT NULL,
    agendamento_representante_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: grupos_recorrencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grupos_recorrencia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupos_recorrencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grupos_recorrencia_id_seq OWNED BY public.grupos_recorrencia.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: localizacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.localizacoes (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    created_by bigint,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: localizacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.localizacoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: localizacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.localizacoes_id_seq OWNED BY public.localizacoes.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: recursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recursos (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status character varying(255) DEFAULT 'disponivel'::character varying NOT NULL,
    fixo boolean DEFAULT true NOT NULL,
    marca character varying(100),
    modelo character varying(100),
    observacoes text,
    created_by bigint,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT recursos_status_check CHECK (((status)::text = ANY ((ARRAY['disponivel'::character varying, 'manutencao'::character varying, 'indisponivel'::character varying])::text[])))
);


--
-- Name: recursos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recursos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recursos_id_seq OWNED BY public.recursos.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    perfil_acesso character varying(255) DEFAULT 'servidores'::character varying NOT NULL,
    profile_photo character varying(255),
    CONSTRAINT users_perfil_acesso_check CHECK (((perfil_acesso)::text = ANY ((ARRAY['administrador'::character varying, 'diretor_geral'::character varying, 'coordenador'::character varying, 'servidores'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos ALTER COLUMN id SET DEFAULT nextval('public.agendamentos_id_seq'::regclass);


--
-- Name: espaco_fotos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_fotos ALTER COLUMN id SET DEFAULT nextval('public.espaco_fotos_id_seq'::regclass);


--
-- Name: espaco_recurso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_recurso ALTER COLUMN id SET DEFAULT nextval('public.espaco_recurso_id_seq'::regclass);


--
-- Name: espacos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos ALTER COLUMN id SET DEFAULT nextval('public.espacos_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: grupos_recorrencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_recorrencia ALTER COLUMN id SET DEFAULT nextval('public.grupos_recorrencia_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: localizacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localizacoes ALTER COLUMN id SET DEFAULT nextval('public.localizacoes_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: recursos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos ALTER COLUMN id SET DEFAULT nextval('public.recursos_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: espaco_fotos espaco_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_fotos
    ADD CONSTRAINT espaco_fotos_pkey PRIMARY KEY (id);


--
-- Name: espaco_recurso espaco_recurso_espaco_id_recurso_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_recurso
    ADD CONSTRAINT espaco_recurso_espaco_id_recurso_id_unique UNIQUE (espaco_id, recurso_id);


--
-- Name: espaco_recurso espaco_recurso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_recurso
    ADD CONSTRAINT espaco_recurso_pkey PRIMARY KEY (id);


--
-- Name: espaco_user espaco_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_user
    ADD CONSTRAINT espaco_user_pkey PRIMARY KEY (espaco_id, user_id);


--
-- Name: espacos espacos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos
    ADD CONSTRAINT espacos_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: grupos_recorrencia grupos_recorrencia_nome_grupo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_recorrencia
    ADD CONSTRAINT grupos_recorrencia_nome_grupo_unique UNIQUE (nome_grupo);


--
-- Name: grupos_recorrencia grupos_recorrencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_recorrencia
    ADD CONSTRAINT grupos_recorrencia_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: localizacoes localizacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localizacoes
    ADD CONSTRAINT localizacoes_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: recursos recursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos
    ADD CONSTRAINT recursos_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: agendamentos_data_inicio_data_fim_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agendamentos_data_inicio_data_fim_index ON public.agendamentos USING btree (data_inicio, data_fim);


--
-- Name: agendamentos_espaco_id_data_inicio_data_fim_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agendamentos_espaco_id_data_inicio_data_fim_index ON public.agendamentos USING btree (espaco_id, data_inicio, data_fim);


--
-- Name: agendamentos_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agendamentos_status_index ON public.agendamentos USING btree (status);


--
-- Name: agendamentos_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agendamentos_user_id_index ON public.agendamentos USING btree (user_id);


--
-- Name: espaco_fotos_espaco_id_ordem_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espaco_fotos_espaco_id_ordem_index ON public.espaco_fotos USING btree (espaco_id, ordem);


--
-- Name: espaco_recurso_espaco_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espaco_recurso_espaco_id_index ON public.espaco_recurso USING btree (espaco_id);


--
-- Name: espaco_recurso_recurso_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espaco_recurso_recurso_id_index ON public.espaco_recurso USING btree (recurso_id);


--
-- Name: espacos_localizacao_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espacos_localizacao_id_index ON public.espacos USING btree (localizacao_id);


--
-- Name: espacos_responsavel_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espacos_responsavel_id_index ON public.espacos USING btree (responsavel_id);


--
-- Name: espacos_status_disponivel_reserva_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX espacos_status_disponivel_reserva_index ON public.espacos USING btree (status, disponivel_reserva);


--
-- Name: grupos_recorrencia_agendamento_representante_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grupos_recorrencia_agendamento_representante_id_index ON public.grupos_recorrencia USING btree (agendamento_representante_id);


--
-- Name: grupos_recorrencia_nome_grupo_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grupos_recorrencia_nome_grupo_index ON public.grupos_recorrencia USING btree (nome_grupo);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: recursos_fixo_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recursos_fixo_index ON public.recursos USING btree (fixo);


--
-- Name: recursos_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recursos_status_index ON public.recursos USING btree (status);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: agendamentos agendamentos_aprovado_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_aprovado_por_foreign FOREIGN KEY (aprovado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: agendamentos agendamentos_espaco_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_espaco_id_foreign FOREIGN KEY (espaco_id) REFERENCES public.espacos(id) ON DELETE CASCADE;


--
-- Name: agendamentos agendamentos_grupo_recorrencia_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_grupo_recorrencia_id_foreign FOREIGN KEY (grupo_recorrencia_id) REFERENCES public.grupos_recorrencia(id) ON DELETE SET NULL;


--
-- Name: agendamentos agendamentos_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: espaco_fotos espaco_fotos_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_fotos
    ADD CONSTRAINT espaco_fotos_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: espaco_fotos espaco_fotos_espaco_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_fotos
    ADD CONSTRAINT espaco_fotos_espaco_id_foreign FOREIGN KEY (espaco_id) REFERENCES public.espacos(id) ON DELETE CASCADE;


--
-- Name: espaco_fotos espaco_fotos_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_fotos
    ADD CONSTRAINT espaco_fotos_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: espaco_recurso espaco_recurso_espaco_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_recurso
    ADD CONSTRAINT espaco_recurso_espaco_id_foreign FOREIGN KEY (espaco_id) REFERENCES public.espacos(id) ON DELETE CASCADE;


--
-- Name: espaco_recurso espaco_recurso_recurso_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_recurso
    ADD CONSTRAINT espaco_recurso_recurso_id_foreign FOREIGN KEY (recurso_id) REFERENCES public.recursos(id) ON DELETE CASCADE;


--
-- Name: espaco_user espaco_user_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_user
    ADD CONSTRAINT espaco_user_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: espaco_user espaco_user_espaco_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_user
    ADD CONSTRAINT espaco_user_espaco_id_foreign FOREIGN KEY (espaco_id) REFERENCES public.espacos(id) ON DELETE CASCADE;


--
-- Name: espaco_user espaco_user_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_user
    ADD CONSTRAINT espaco_user_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: espaco_user espaco_user_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espaco_user
    ADD CONSTRAINT espaco_user_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: espacos espacos_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos
    ADD CONSTRAINT espacos_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: espacos espacos_localizacao_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos
    ADD CONSTRAINT espacos_localizacao_id_foreign FOREIGN KEY (localizacao_id) REFERENCES public.localizacoes(id) ON DELETE SET NULL;


--
-- Name: espacos espacos_responsavel_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos
    ADD CONSTRAINT espacos_responsavel_id_foreign FOREIGN KEY (responsavel_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: espacos espacos_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.espacos
    ADD CONSTRAINT espacos_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: localizacoes localizacoes_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localizacoes
    ADD CONSTRAINT localizacoes_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: localizacoes localizacoes_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localizacoes
    ADD CONSTRAINT localizacoes_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: recursos recursos_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos
    ADD CONSTRAINT recursos_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: recursos recursos_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos
    ADD CONSTRAINT recursos_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2025_07_12_224131_add_perfil_acesso_to_users_table	1
5	2025_07_13_175111_gerenciar_espacos	1
6	2025_07_14_000000_create_espaco_fotos_table	1
9	2025_07_14_222506_atribuir_permissoes	2
10	2025_07_22_173713_create_agendamentos_table	3
11	2024_01_15_000000_add_grupo_recorrencia_to_agendamentos	4
12	2025_07_28_190204_add_profile_photo_to_users_table	5
14	2025_07_29_000000_add_grupo_recorrencia_to_agendamentos	6
16	2025_07_28_000000_create_grupos_recorrencia_table	7
17	2025_08_09_002422_refactor_grupo_recorrencia_structure	7
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 17, true);


--
-- PostgreSQL database dump complete
--

