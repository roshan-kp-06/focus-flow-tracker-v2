import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, CheckSquare } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start taking notes...',
  className,
  editable = true,
}: RichTextEditorProps) {
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
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content ? JSON.parse(content) : '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== content) {
        editor.commands.setContent(JSON.parse(content));
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  // Check if className suggests full height mode
  const isFullHeight = className?.includes('flex-1') || className?.includes('h-full');

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-background flex flex-col', className)}>
      {editable && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/30 flex-shrink-0">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <div className="w-px h-6 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive('taskList')}
            onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
            aria-label="Checklist"
          >
            <CheckSquare className="h-4 w-4" />
          </Toggle>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          isFullHeight ? "flex-1 overflow-auto [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-full" : "min-h-[200px]",
          !content && "[&_.ProseMirror]:before:content-[attr(data-placeholder)] [&_.ProseMirror]:before:text-muted-foreground/50 [&_.ProseMirror]:before:float-left [&_.ProseMirror]:before:h-0 [&_.ProseMirror]:before:pointer-events-none"
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
}
