import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { parseExploreImageFilename } from '@/lib/utils/parse-explore-image-metadata';
import ShareRedirectClient from './ShareRedirectClient';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const supabase = await createClient();
  
  // Try to fetch share link first
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('signed_image_url, style_id, scene_id')
    .eq('short_code', code)
    .maybeSingle();
  
  if (shareLink?.signed_image_url) {
    console.log('Share link found with signed URL:', shareLink.signed_image_url);
    return {
      title: 'My new AI shot! 🤩 | Primeshot',
      description: 'Made with @primeshotai from a few selfies - Copy my shoot setup/style, it\'s free to try!',
      openGraph: {
        title: 'My new AI shot! 🤩',
        description: 'Made with @primeshotai from a few selfies.\n\nCopy my shoot setup/style - it\'s free to try!',
        images: [
          {
            url: shareLink.signed_image_url,
            width: 1200,
            height: 630,
            alt: 'AI Generated Photo'
          }
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'My new AI shot! 🤩',
        description: 'Made with @primeshotai from a few selfies.\n\nCopy my shoot setup/style - it\'s free to try!',
        images: [shareLink.signed_image_url],
      },
    };
  }
  
  console.log('No signed URL found for share link:', code);
  
  // Fallback: Try explore image
  const { data: exploreImage } = await supabase
    .from('explore_images')
    .select('s3_path')
    .eq('short_code', code)
    .maybeSingle();
  
  if (exploreImage) {
    const filename = exploreImage.s3_path.replace(/^placeholders\/styles\//i, '');
    const metadata = parseExploreImageFilename(filename);
    
    // Explore images are public
    const cdnUrl = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/${exploreImage.s3_path}`;
    
    return {
      title: `${metadata?.styleFormatted || 'AI Photoshoot'} | Primeshot`,
      description: 'Create your own AI photoshoot with Primeshot',
      openGraph: {
        title: `${metadata?.styleFormatted || 'AI Photoshoot'}`,
        description: 'Create your own AI photoshoot with Primeshot\n\nGet started today!',
        images: [
          {
            url: cdnUrl,
            width: 1200,
            height: 630,
            alt: metadata?.styleFormatted || 'AI Generated Photo'
          }
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${metadata?.styleFormatted || 'AI Photoshoot'}`,
        description: 'Create your own AI photoshoot with Primeshot\n\nGet started today!',
        images: [cdnUrl],
      },
    };
  }
  
  // Default fallback
  console.log('No share link or explore image found for code:', code);
  return {
    title: 'Primeshot - AI Photoshoot Generator',
    description: 'Create stunning AI-generated photos in seconds',
  };
}

export default function ShareRedirectPage({ params }: Props) {
  return <ShareRedirectClient params={params} />;
}
