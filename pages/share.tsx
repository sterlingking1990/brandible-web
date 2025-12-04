import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from '../styles/Share.module.css';

interface MediaData {
  media_id: string;
  media_url: string;
  brand_phone: string;
  referrer_id: string;
  status_id: string;
  brand_id: string;
}

interface StatusData {
  title: string;
  description?: string;
  type: string;
  reward_amount: number;
}

interface BrandData {
  full_name: string;
  username: string;
  brands?: Array<{
    company_name?: string;
    industry?: string;
    business_phone_number?: string;
    business_category?: string;
    business_description?: string;
  }>;
}

interface SharePageProps {
  mediaData: MediaData | null;
  statusData: StatusData | null;
  brandData: BrandData | null;
  initialError?: string;
}

export default function Share({ mediaData, statusData, brandData, initialError }: SharePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Client-side click tracking (unchanged)
  const logLinkClick = async (
    mediaId: string,
    referrerId: string,
    statusId: string,
    brandId: string
  ) => {
    try {
      console.log('Attempting to log link click for media:', mediaId);
      
      const { data, error } = await supabase.rpc('log_anonymous_activity', {
        p_action_type: 'share_link_clicked',
        p_entity_type: 'status_media',
        p_entity_id: mediaId,
        p_referrer_id: referrerId,
        p_metadata: {
          referrer_id: referrerId,
          status_post_id: statusId,
          brand_id: brandId,
          media_id: mediaId,
          source: 'share_link',
          device_type: /Mobile|Android|iPhone/.test(navigator.userAgent)
            ? 'mobile'
            : 'desktop',
          referrer_domain: document.referrer || 'direct',
          user_agent: navigator.userAgent,
          page_title: document.title,
          timestamp_clicked: new Date().toISOString(),
        }
      });

      if (error) {
        console.error('Error logging link click:', error);
      } else {
        console.log('Link click tracked successfully');
      }
    } catch (error) {
      console.error('Error in logLinkClick:', error);
    }
  };

  const logMessageClick = async (
    mediaId: string,
    referrerId: string,
    statusId: string,
    brandId: string
  ) => {
    try {
      console.log('Attempting to log message click for media:', mediaId);
      
      const { data, error } = await supabase.rpc('log_anonymous_activity', {
        p_action_type: 'share_message_clicked',
        p_entity_type: 'status_media',
        p_entity_id: mediaId,
        p_referrer_id: referrerId,
        p_metadata: {
          referrer_id: referrerId,
          status_post_id: statusId,
          brand_id: brandId,
          media_id: mediaId,
          source: 'share_page_whatsapp',
          device_type: /Mobile|Android|iPhone/.test(navigator.userAgent)
            ? 'mobile'
            : 'desktop',
          action: 'message_brand_clicked',
          user_agent: navigator.userAgent,
          page_title: document.title,
          timestamp_clicked: new Date().toISOString(),
        }
      });
      
      if (error) {
        console.error('Error logging message click:', error);
      } else {
        console.log('Message click tracked successfully');
      }
    } catch (error) {
      console.error('Error in logMessageClick:', error);
    }
  };

  // Client-side click tracking on mount
  useEffect(() => {
    if (mediaData) {
      logLinkClick(
        mediaData.media_id,
        mediaData.referrer_id,
        mediaData.status_id,
        mediaData.brand_id
      );
    }
  }, [mediaData]);

  const handleMessageBrand = () => {
    if (mediaData?.brand_phone) {
      logMessageClick(
        mediaData.media_id,
        mediaData.referrer_id,
        mediaData.status_id,
        mediaData.brand_id
      );

      const message = `Hi! I saw your "${statusData?.title}" campaign on Brandible and I'm interested to learn more.`;
      window.open(
        `https://wa.me/${mediaData.brand_phone}?text=${encodeURIComponent(
          message
        )}`,
        '_blank'
      );
    }
  };

const handleSignUpOrOpen = () => {
  // Use concatenated format without & separators
  const deepLink = `brandible://share?mid${mediaData?.media_id}rid${mediaData?.referrer_id}sid${mediaData?.status_id}`;
  const appStoreLink = 'https://apps.apple.com/app/brandiblebms';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.brandiblebms.app';

  console.log('Generated deep link:', deepLink);
  window.location.href = deepLink;

  setTimeout(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      window.open(appStoreLink, '_blank');
    } else if (isAndroid) {
      window.open(playStoreLink, '_blank');
    } else {
      window.open(appStoreLink, '_blank');
    }
  }, 1000);
};

  if (!mediaData || !statusData || !brandData) {
    return (
      <>
        <Head>
          <title>Brandible - Content Not Found</title>
          <meta name="description" content="The requested content could not be found" />
        </Head>
        <div className={styles.error}>
          {initialError || 'Content not found'}
        </div>
      </>
    );
  }

  const brand = brandData.brands?.[0] || {};
  const campaignType =
    statusData.type === 'status_view'
      ? 'Ad Campaign'
      : statusData.type === 'challenge'
        ? 'Challenge'
        : 'Survey';

  // Meta content - now available immediately for SSR
  const pageTitle = `${statusData.title} - ${brand.company_name || brandData.full_name} on Brandible`;
  const pageDescription = statusData.description || `Check out this ${campaignType} from ${brand.company_name || brandData.full_name}. Earn ${statusData.reward_amount} coins!`;
  const pageImage = mediaData.media_url;
  const pageUrl = `https://shop.brandiblebms.com/share?media_id=${mediaData.media_id}&referrer_id=${mediaData.referrer_id}&brand_id=${mediaData.brand_id}&status_id=${mediaData.status_id}&brand_phone=${mediaData.brand_phone}`;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph Meta Tags (Facebook, WhatsApp, LinkedIn) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Brandible" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.mediaContainer}>
            <img
              src={mediaData.media_url}
              alt="Shared content"
              className={styles.media}
            />
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{statusData.title}</h1>

            <p className={styles.campaignType}>
              {campaignType} • {statusData.reward_amount} coins reward
            </p>

            {statusData.description && (
              <p className={styles.description}>{statusData.description}</p>
            )}

            <div className={styles.brandInfo}>
              <h3 className={styles.brandName}>
                {brand.company_name || brandData.full_name}
              </h3>
              {brand.business_category && (
                <p className={styles.category}>{brand.business_category}</p>
              )}
              {brand.business_description && (
                <p className={styles.brandDescription}>
                  {brand.business_description}
                </p>
              )}
            </div>

            <div className={styles.viewMoreContainer}>
              <a
                href={`/${brandData.username}/wall`}
                className={styles.viewMoreLink}
              >
                View more from {brand.company_name || brandData.full_name}
                's collection
              </a>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={handleMessageBrand} className={styles.messageBtn}>
              Message this Brand
            </button>

            <button
              onClick={handleSignUpOrOpen}
              className={styles.signupBtn}
            >
              Claim Reward In Brandible App
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { media_id, referrer_id, brand_phone, brand_id, status_id } = context.query;

  // Validate required parameters
  if (!media_id || !brand_id || !status_id) {
    return {
      props: {
        mediaData: null,
        statusData: null,
        brandData: null,
        initialError: 'Missing required parameters'
      }
    };
  }

  try {
    // Fetch media data
    const { data: media, error: mediaError } = await supabase
      .from('status_media')
      .select('media_url')
      .eq('id', media_id as string)
      .single();

    if (mediaError) throw mediaError;

    const mediaData: MediaData = {
      media_id: media_id as string,
      media_url: media.media_url,
      brand_phone: (brand_phone as string) || '',
      referrer_id: (referrer_id as string) || '',
      status_id: status_id as string,
      brand_id: brand_id as string,
    };

    // Fetch status data
    const { data: statusData, error: statusError } = await supabase.rpc(
      'get_public_status_info',
      { p_status_id: status_id as string }
    );

    if (statusError) throw statusError;

    // Fetch brand data
    const { data: brandData, error: brandError } = await supabase
      .from('profiles')
      .select(
        `
        full_name,
        username,
        bio,
        avatar_url,
        brands (
          company_name,
          industry,
          business_phone_number
        )
      `
      )
      .eq('id', brand_id as string)
      .single();

    if (brandError) throw brandError;

    return {
      props: {
        mediaData,
        statusData,
        brandData,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {
        mediaData: null,
        statusData: null,
        brandData: null,
        initialError: 'Failed to load content'
      },
    };
  }
};