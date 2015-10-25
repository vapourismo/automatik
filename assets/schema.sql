--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: backends; Type: TABLE; Schema: public; Owner: automatik; Tablespace: 
--

CREATE TABLE backends (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    driver character varying(255) NOT NULL,
    config json
);


ALTER TABLE backends OWNER TO automatik;

--
-- Name: backends_id_seq; Type: SEQUENCE; Schema: public; Owner: automatik
--

CREATE SEQUENCE backends_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE backends_id_seq OWNER TO automatik;

--
-- Name: backends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: automatik
--

ALTER SEQUENCE backends_id_seq OWNED BY backends.id;


--
-- Name: datapoints; Type: TABLE; Schema: public; Owner: automatik; Tablespace: 
--

CREATE TABLE datapoints (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    backend integer NOT NULL,
    config json,
    value json
);


ALTER TABLE datapoints OWNER TO automatik;

--
-- Name: datapoints_id_seq; Type: SEQUENCE; Schema: public; Owner: automatik
--

CREATE SEQUENCE datapoints_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE datapoints_id_seq OWNER TO automatik;

--
-- Name: datapoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: automatik
--

ALTER SEQUENCE datapoints_id_seq OWNED BY datapoints.id;


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: automatik
--

CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE groups_id_seq OWNER TO automatik;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: automatik; Tablespace: 
--

CREATE TABLE groups (
    id integer DEFAULT nextval('groups_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    parent integer
);


ALTER TABLE groups OWNER TO automatik;

--
-- Name: id; Type: DEFAULT; Schema: public; Owner: automatik
--

ALTER TABLE ONLY backends ALTER COLUMN id SET DEFAULT nextval('backends_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: automatik
--

ALTER TABLE ONLY datapoints ALTER COLUMN id SET DEFAULT nextval('datapoints_id_seq'::regclass);


--
-- Name: backends_name_key; Type: CONSTRAINT; Schema: public; Owner: automatik; Tablespace: 
--

ALTER TABLE ONLY backends
    ADD CONSTRAINT backends_name_key UNIQUE (name);


--
-- Name: backends_pkey; Type: CONSTRAINT; Schema: public; Owner: automatik; Tablespace: 
--

ALTER TABLE ONLY backends
    ADD CONSTRAINT backends_pkey PRIMARY KEY (id);


--
-- Name: datapoints_name_key; Type: CONSTRAINT; Schema: public; Owner: automatik; Tablespace: 
--

ALTER TABLE ONLY datapoints
    ADD CONSTRAINT datapoints_name_key UNIQUE (name);


--
-- Name: datapoints_pkey; Type: CONSTRAINT; Schema: public; Owner: automatik; Tablespace: 
--

ALTER TABLE ONLY datapoints
    ADD CONSTRAINT datapoints_pkey PRIMARY KEY (id);


--
-- Name: groups_pkey; Type: CONSTRAINT; Schema: public; Owner: automatik; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: groups_name_parent_unique; Type: INDEX; Schema: public; Owner: automatik; Tablespace: 
--

CREATE UNIQUE INDEX groups_name_parent_unique ON groups USING btree (name, parent) WHERE (parent IS NOT NULL);


--
-- Name: groups_name_unique; Type: INDEX; Schema: public; Owner: automatik; Tablespace: 
--

CREATE UNIQUE INDEX groups_name_unique ON groups USING btree (name) WHERE (parent IS NULL);


--
-- Name: datapoints_backend_fkey; Type: FK CONSTRAINT; Schema: public; Owner: automatik
--

ALTER TABLE ONLY datapoints
    ADD CONSTRAINT datapoints_backend_fkey FOREIGN KEY (backend) REFERENCES backends(id);


--
-- Name: groups_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: automatik
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_parent_fkey FOREIGN KEY (parent) REFERENCES groups(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

