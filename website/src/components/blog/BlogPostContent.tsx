'use client';

import { ExtendedRecordMap } from 'notion-types';
import { NotionRenderer } from 'react-notion-x';
import Image from 'next/image';
import Link from 'next/link';

// Import Notion styles
import 'react-notion-x/src/styles.css';

interface BlogPostContentProps {
  content: ExtendedRecordMap;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <div className="notion-content">
      <NotionRenderer
        recordMap={content}
        fullPage={false}
        darkMode={true}
        components={{
          // Use Next.js Image component
          Image: ({ src, alt, ...props }) => {
            return (
              <Image
                src={src}
                alt={alt || ''}
                width={1200}
                height={800}
                className="rounded-lg"
                {...props}
              />
            );
          },
          // Use Next.js Link component
          Link: ({ href, children, ...props }) => {
            if (href.startsWith('http')) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              );
            }
            return (
              <Link href={href} {...props}>
                {children}
              </Link>
            );
          },
        }}
      />
      
      <style jsx global>{`
        .notion-content {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .notion-page {
          padding: 0;
          width: 100%;
        }

        .notion-title {
          display: none;
        }

        .notion-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          line-height: 1.6;
        }

        .notion-h1,
        .notion-h2,
        .notion-h3 {
          color: white;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .notion-h1 {
          font-size: 2rem;
        }

        .notion-h2 {
          font-size: 1.5rem;
        }

        .notion-h3 {
          font-size: 1.25rem;
        }

        .notion-code {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.875rem;
        }

        .notion-callout {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
        }

        .notion-quote {
          border-left: 3px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.6);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }

        .notion-link {
          color: #60a5fa;
          text-decoration: none;
        }

        .notion-link:hover {
          text-decoration: underline;
        }

        .notion-table {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .notion-table-cell {
          border-color: rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
        }

        .notion-list {
          color: rgba(255, 255, 255, 0.6);
          margin: 1rem 0;
        }

        .notion-list-disc,
        .notion-list-numbered {
          padding-left: 1.5rem;
        }

        .notion-asset-wrapper {
          margin: 1.5rem 0;
        }

        .notion-image {
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}

