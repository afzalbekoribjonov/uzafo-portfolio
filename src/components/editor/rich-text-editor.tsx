'use client';

import {useEffect} from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Underline as UnderlineIcon
} from 'lucide-react';
import {cn} from '@/lib/utils';

const toolbar = [
  {label: 'Paragraph', icon: Pilcrow, action: 'paragraph'},
  {label: 'H1', icon: Heading1, action: 'heading1'},
  {label: 'H2', icon: Heading2, action: 'heading2'},
  {label: 'H3', icon: Heading3, action: 'heading3'},
  {label: 'Bold', icon: Bold, action: 'bold'},
  {label: 'Italic', icon: Italic, action: 'italic'},
  {label: 'Underline', icon: UnderlineIcon, action: 'underline'},
  {label: 'Bullet List', icon: List, action: 'bullet'},
  {label: 'Ordered List', icon: ListOrdered, action: 'ordered'},
  {label: 'Quote', icon: Quote, action: 'quote'},
  {label: 'Code', icon: Code, action: 'code'}
] as const;

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value = '<p></p>',
  onChange,
  placeholder = 'Write your content here...',
  className
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {levels: [1, 2, 3]}
      }),
      Placeholder.configure({placeholder})
    ],
    content: value,
    onUpdate: ({editor: currentEditor}) => {
      onChange?.(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, {emitUpdate: false});
    }
  }, [editor, value]);

  const runAction = (action: (typeof toolbar)[number]['action']) => {
    if (!editor) return;
    switch (action) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'heading1':
        editor.chain().focus().toggleHeading({level: 1}).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({level: 2}).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({level: 3}).run();
        break;
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'ordered':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70', className)}>
      <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
        {toolbar.map((item) => {
          const Icon = item.icon;
          const active =
            (item.action === 'paragraph' && editor?.isActive('paragraph')) ||
            (item.action === 'heading1' && editor?.isActive('heading', {level: 1})) ||
            (item.action === 'heading2' && editor?.isActive('heading', {level: 2})) ||
            (item.action === 'heading3' && editor?.isActive('heading', {level: 3})) ||
            (item.action === 'bold' && editor?.isActive('bold')) ||
            (item.action === 'italic' && editor?.isActive('italic')) ||
            (item.action === 'underline' && editor?.isActive('underline')) ||
            (item.action === 'bullet' && editor?.isActive('bulletList')) ||
            (item.action === 'ordered' && editor?.isActive('orderedList')) ||
            (item.action === 'quote' && editor?.isActive('blockquote')) ||
            (item.action === 'code' && editor?.isActive('codeBlock'));

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => runAction(item.action)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
                active
                  ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[280px] px-4 py-4 text-sm leading-7 text-slate-200 [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-cyan-300/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-2xl [&_.ProseMirror_pre]:bg-slate-900 [&_.ProseMirror_pre]:p-4"
      />
    </div>
  );
}
