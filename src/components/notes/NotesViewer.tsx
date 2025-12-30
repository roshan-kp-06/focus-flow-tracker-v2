import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { cn } from '@/lib/utils';

interface NotesViewerProps {
  content: string;
  className?: string;
}

export function NotesViewer({ content, className }: NotesViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content ? JSON.parse(content) : '',
    editable: false,
  });

  if (!editor || !content) return null;

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
