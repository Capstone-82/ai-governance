import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Override default elements for custom styling
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="leading-7 mb-4 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    a: ({ node, ...props }) => (
                        <a
                            className="text-primary hover:underline inline-flex items-center gap-1 font-medium break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {props.children}
                            <ExternalLink className="w-3 h-3 inline-block" />
                        </a>
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground my-4" {...props} />
                    ),
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');

                        if (isInline) {
                            return (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary break-all" {...props}>
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <div className="relative my-4 rounded-lg overflow-hidden border border-border bg-muted/50">
                                <div className="overflow-x-auto p-4">
                                    <pre className="text-sm font-mono leading-relaxed" {...props}>
                                        <code>{children}</code>
                                    </pre>
                                </div>
                            </div>
                        );
                    },
                    table: ({ node, ...props }) => (
                        <div className="my-4 w-full overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th className="border-b border-border bg-muted/50 px-4 py-2 text-left font-medium" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="border-b border-border px-4 py-2 last:border-0" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
