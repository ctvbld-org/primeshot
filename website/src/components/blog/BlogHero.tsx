import ContentPageHeader from '@/components/ContentPageHeader';

interface BlogHeroProps {
  title: string;
}

export function BlogHero({ title }: BlogHeroProps) {
  return (
    <ContentPageHeader 
      title={title}
      backgroundImage=""
    />
  );
}

