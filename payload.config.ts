import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payload runs inside this Next app and against the Supabase Postgres we
 * already have, so there is no second service and no second datastore.
 *
 * Two routes are moved off their defaults deliberately:
 *   admin  /cms       because /admin is the previous panel, still working
 *   api    /cms-api   because a catch-all at /api would sit in the same URL
 *                     space as the app's own forty-odd API routes
 *
 * Payload owns the tables it creates. They are additive: nothing it does
 * touches note_overrides, answer_evaluations, contact_submissions,
 * user_profiles, topper_copies, posts or notifications.
 */

const SECTIONS = [
  { label: 'Ancient India', value: 'Ancient India' },
  { label: 'Medieval India', value: 'Medieval India' },
  { label: 'Modern India', value: 'Modern India' },
  { label: 'World History', value: 'World History' },
];

export default buildConfig({
  admin: {
    user: 'cms_users',
    meta: {
      titleSuffix: ' · History Optional',
    },
    // Light only. The views are built on Untitled UI, whose dark token block we
    // removed, so letting the panel follow an OS dark preference would render
    // half-themed. Pinning is the honest version of that.
    theme: 'light',
    components: {
      // Six screens read tables the app owns rather than Payload collections,
      // so they are custom views. They are server components and query Supabase
      // directly: the /api/admin routes are gated by the old admin token, which
      // a Payload session does not carry, and Payload's own auth already gates
      // everything under /cms.
      afterNavLinks: ['/app/(payload)/views/NavLinks.tsx#default'],
      views: {
        overview:     { Component: '/app/(payload)/views/Overview.tsx#default',     path: '/overview' },
        evaluations:  { Component: '/app/(payload)/views/Evaluations.tsx#default',  path: '/evaluations' },
        submissions:  { Component: '/app/(payload)/views/Submissions.tsx#default',  path: '/submissions' },
        phones:       { Component: '/app/(payload)/views/Phones.tsx#default',       path: '/phones' },
        topperCopies: { Component: '/app/(payload)/views/TopperCopies.tsx#default', path: '/topper-copies' },
        operations:   { Component: '/app/(payload)/views/Operations.tsx#default',   path: '/operations' },
      },
    },
  },
  routes: {
    admin: '/cms',
    api: '/cms-api',
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'set-PAYLOAD_SECRET-in-env-local',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Tables are prefixed so Payload's schema is obvious in the Supabase
  // dashboard and can never be confused with the app's own tables.
  // Payload lives in its own Postgres schema. This is not tidiness: Payload
  // introspects primary keys at boot, and that introspection crashes on a
  // database that already contains a table with a composite primary key
  // (payloadcms/payload#12858). This database has one, topper_copy_pyq_map,
  // and user_profiles has no primary key at all. A dedicated schema means
  // Payload never looks at the app's tables, and the separation is absolute.
  db: postgresAdapter({
    schemaName: 'payload',
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // The build prerenders 51 note pages, each opening a connection. Capped
      // so a build cannot exhaust the pooler: the session pooler allows 15
      // clients in total and hit EMAXCONNSESSION without this.
      max: 8,
    },
  }),
  collections: [
    {
      slug: 'cms_users',
      auth: true,
      admin: { useAsTitle: 'email', group: 'System' },
      fields: [
        { name: 'name', type: 'text' },
      ],
    },
    {
      slug: 'notes',
      labels: { singular: 'Note', plural: 'Notes' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'section', 'paper', 'topic', 'updatedAt'],
        group: 'Syllabus',
      },
      versions: { drafts: true },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'slug', type: 'text', required: true, unique: true,
          admin: { description: 'Must match the slug in lib/notes.ts so the site can find it.' },
        },
        { name: 'section', type: 'select', required: true, options: SECTIONS },
        {
          name: 'paper', type: 'select', required: true,
          options: [{ label: 'Paper 1', value: '1' }, { label: 'Paper 2', value: '2' }],
        },
        { name: 'topic', type: 'number', admin: { description: 'Ordinal within the syllabus.' } },
        { name: 'description', type: 'textarea' },
        { name: 'subtopics', type: 'array', fields: [{ name: 'label', type: 'text', required: true }] },
        {
          name: 'content', type: 'richText',
          admin: { description: 'English body. This is what most readers see.' },
        },
        {
          // The site has a full Hindi corpus and note_overrides has no language
          // column, so an English edit there silently replaced what Hindi
          // readers saw. Separate fields end that: each language is edited and
          // served on its own, and Hindi still falls back to English when a
          // topic has no Hindi body.
          name: 'contentHi', type: 'richText',
          label: 'Content (Hindi)',
          admin: { description: 'Hindi body. Leave empty to fall back to English.' },
        },
      ],
    },
    {
      slug: 'articles',
      labels: { singular: 'Article', plural: 'Articles' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'kind', '_status', 'publishedAt'],
        group: 'Editorial',
      },
      versions: { drafts: true },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', unique: true },
        {
          // Values mirror PostType in the existing app: 'current-affairs' | 'new-note'.
          // The default has to be one of them; 'note' is not a member.
          name: 'kind', type: 'select', required: true, defaultValue: 'new-note',
          options: [
            { label: 'Current affairs', value: 'current-affairs' },
            { label: 'Note', value: 'new-note' },
          ],
        },
        { name: 'excerpt', type: 'textarea' },
        { name: 'tags', type: 'array', fields: [{ name: 'label', type: 'text', required: true }] },
        { name: 'publishedAt', type: 'date' },
        { name: 'content', type: 'richText' },
      ],
    },
    {
      slug: 'announcements',
      labels: { singular: 'Announcement', plural: 'Announcements' },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'kind', 'createdAt'], group: 'Editorial' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'link', type: 'text' },
        {
          name: 'kind', type: 'select', required: true, defaultValue: 'announcement',
          options: [
            { label: 'Announcement', value: 'announcement' },
            { label: 'Note', value: 'note' },
            { label: 'Current affairs', value: 'current_affairs' },
          ],
        },
      ],
    },
  ],
});
