"use client";
import { useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { DocNode } from "@/lib/wiki";

type Initial = { name: string; epithet: string; born: string | null; died: string | null; body: DocNode };

export function CharacterForm({
  initial, names, action,
}: {
  initial: Initial;
  names: string[];
  action: (form: FormData) => Promise<{ error?: string } | void>;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2] } })],
    content: initial.body,
    immediatelyRender: false,
    editorProps: { attributes: { "aria-label": "Character text" } },
  });

  const insert = (n: string) => editor?.chain().focus().insertContent(`[[${n}]]`).run();

  return (
    <form
      className="space-y-6"
      action={(form) => {
        form.set("body", JSON.stringify(editor?.getJSON() ?? initial.body));
        start(async () => {
          const r = await action(form);
          if (r?.error) setError(r.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" value={initial.name} required />
        <Field label="Title or epithet" name="epithet" value={initial.epithet} />
        <Field label="Born" name="born" value={initial.born ?? ""} placeholder="Year 312" />
        <Field label="Died" name="died" value={initial.died ?? ""} placeholder="Leave empty if alive" />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted">Text. Type <code className="font-mono text-link">[[Name]]</code> to link a character.</span>
          <div className="flex gap-1">
            <Tool on={() => editor?.chain().focus().toggleBold().run()} label="Bold">B</Tool>
            <Tool on={() => editor?.chain().focus().toggleItalic().run()} label="Italic"><i>I</i></Tool>
            <Tool on={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading">H</Tool>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-card p-4 text-[17px]">
          <EditorContent editor={editor} />
        </div>
        {names.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Insert a link">
            {names.map((n) => (
              <button key={n} type="button" onClick={() => insert(n)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-link hover:text-link">
                + {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p role="alert" className="text-link">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-ink px-5 py-3 font-medium text-paper hover:bg-link disabled:opacity-60">
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}

function Field({ label, ...p }: { label: string; name: string; value: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <input name={p.name} defaultValue={p.value} required={p.required} placeholder={p.placeholder}
        className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base" />
    </label>
  );
}

function Tool({ on, label, children }: { on: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={on} aria-label={label} className="h-9 w-9 rounded-md border border-line bg-card text-sm hover:border-ink">
      {children}
    </button>
  );
}
