#!/usr/bin/perl
use WDBI::Px;
use Data::Dumper;

@lines=<DATA>;

print "\t".join("+\n\t",map {$_=~s/\s*$/ /; esc('js',$_)} @lines).";\n";

__DATA__
 SELECT 
 	q.oid, q.regclass, q.stereotype, q.sql_identifier, 
	r.rolname AS owner, n.nspname AS namespace, q.name, 
	q.language, 
	q.argnames, 
	q.argtypes, 
	q.description, 
	(EXISTS ( SELECT a.a FROM unnest(q.acl) a(a) WHERE a.a::text ~~ 'http=%X%/%'::text)) 
		AS has_http_acl, 
	q.body, 
	cast(
		(
			'-- Name: '::text || q.name::text || 
			'; Type: '::text || q.stereotype || 
			'; Schema: '::text || n.nspname::text || 
			'; Owner: '::text || r.rolname::text || E'\n\n'::text
		) || 
		('-- DROP '::text || q.stereotype || ' IF EXISTS '::text || q.sql_identifier || E';\n\n') ||
		(q.sql_ddl || E';\n\n') ||
		'ALTER '::text || q.stereotype || ' '::text || q.sql_identifier || 
		' OWNER TO '::text || quote_ident(r.rolname::text) || E';\n\n'::text ||
		COALESCE(
			'COMMENT ON '::text || q.stereotype || ' '::text || q.sql_identifier || 
			' IS '::text || quote_literal(q.description) || E';\n'::text, 
		''::text)
	as text) AS sql_ddl
   FROM 
   (         
	SELECT 	c.oid, 'pg_class'::regclass AS regclass, 'VIEW'::text AS stereotype, c.oid::regclass::text AS sql_identifier, 
		c.relname AS name, 'sql'::text AS language, 
		obj_description(c.oid, 'pg_class'::name) AS description, 
		pg_get_viewdef(c.oid, true) AS body, 
		cast('CREATE OR REPLACE VIEW '::text || c.oid::regclass::text || E' AS \n'::text || pg_get_viewdef(c.oid, true) 
			AS text) AS sql_ddl, 
		c.relacl AS acl, c.relowner AS _owner, c.relnamespace AS _namespace, 
		NULL::text[] AS argnames, NULL::text[] AS argtypes
	FROM pg_class c
	WHERE c.relkind = 'v'::char AND has_table_privilege(c.oid, 'select'::text)

	UNION ALL 

	SELECT 	p.oid, 'pg_proc'::regclass AS regclass, 'FUNCTION'::text AS stereotype, p.oid::regprocedure::text AS sql_identifier, 
		p.proname AS name, l.lanname AS language, 
		obj_description(p.oid, 'pg_proc'::name) AS description, 
		p.prosrc AS body, 
		pg_get_functiondef(p.oid) AS sql_ddl, 
		p.proacl AS acl, p.proowner AS _owner, p.pronamespace AS _namespace, 
		(
			SELECT array_agg(p.proargnames[pam.i]) AS array_agg
			FROM ( SELECT i.i, p.proargmodes[i.i] AS mode
				FROM generate_series(1, array_length(p.proargmodes, 1)) i(i)
				WHERE p.proargmodes[i.i] IN ('i','b')
			) AS pam
                ) AS argnames, 
                ( 
			SELECT array_agg(((('{'::text || oidvectortypes(p.proargtypes)) || '}'::text)::text[])[pam.i]) AS array_agg
                       FROM ( 
				SELECT i.i, p.proargmodes[i.i] AS mode
				FROM generate_series(1, array_length(p.proargmodes, 1)) i(i)
				WHERE p.proargmodes[i.i] IN ('i','b')
			) AS pam
		) AS argtypes
	FROM pg_proc p
	JOIN pg_language l ON l.oid = p.prolang
	WHERE p.proretset AND has_function_privilege(p.oid, 'execute'::text)
) AS q
JOIN pg_roles r ON r.oid = q._owner
JOIN pg_namespace n ON n.oid = q._namespace
