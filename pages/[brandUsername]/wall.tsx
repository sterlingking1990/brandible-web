import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import styles from '../../styles/BrandWall.module.css';
import Head from 'next/head';

declare global {
  interface Window { ttq: any }
}

interface BrandWallMedia {
  id: string;
  media_url: string;
  media_type: string;
  caption: string;
}

interface BrandData {
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  brands?: Array<{
    company_name?: string;
    business_phone_number?: string;
  }>;
}

export default function BrandWall() {
  const router = useRouter();
  const { brandUsername, mediaId, referrer_id } = router.query;
  const [media, setMedia] = useState<BrandWallMedia[]>([]);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<BrandWallMedia | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mediaRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const handleTikTokEvent = (eventName: string, eventId: string) => {
    const contentId = Array.isArray(brandUsername) ? brandUsername[0] : brandUsername as string
  // Browser side
  window.ttq?.track(eventName, {
    content_id: contentId,
    content_type: 'product',
    event_id: eventId,
  })

  // Server side
  fetch('/api/tiktok-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      brand_username: brandUsername,
    })
  })
}

  useEffect(() => {
    if (brandUsername) {
      fetchBrandDataAndMedia(brandUsername as string);
    }
     // Fire ViewContent when wall loads
    const eventId = uuidv4()
    handleTikTokEvent('ViewContent', eventId)
  }, [brandUsername]);

  // Handle mediaId highlighting and scrolling
  useEffect(() => {
    if (mediaId && media.length > 0) {
      const targetMedia = media.find(item => item.id === mediaId);
      
      if (targetMedia && mediaRefs.current[mediaId as string]) {
        // Scroll to the media item
        setTimeout(() => {
          mediaRefs.current[mediaId as string]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Add highlight class
          mediaRefs.current[mediaId as string]?.classList.add(styles.highlighted);
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            mediaRefs.current[mediaId as string]?.classList.remove(styles.highlighted);
          }, 3000);

          // Optionally auto-open the modal for the shared media
          const index = media.findIndex(item => item.id === mediaId);
          if (index !== -1) {
            setSelectedIndex(index);
            setSelectedMedia(media[index]);
          }
        }, 500); // Small delay to ensure DOM is ready
      }
    }
  }, [mediaId, media]);

  const fetchBrandDataAndMedia = async (username: string) => {
    try {
      const { data: brandData, error: brandError } = await supabase
        .from('profiles')
        .select(`
          full_name,
          username,
          avatar_url,
          bio,
          brands (
            id,
            company_name,
            business_phone_number
          )
        `)
        .eq('username', username)
        .single();

      if (brandError) throw brandError;
      setBrandData(brandData);

      if (brandData.brands && brandData.brands.length > 0) {
        const { data: media, error: mediaError } = await supabase
          .from('brand_wall_media')
          .select('*')
          .eq('brand_id', brandData.brands[0].id)
          .order('created_at', { ascending: false });

        if (mediaError) throw mediaError;
        setMedia(media);
      }
    } catch (error) {
      console.error('Error fetching brand wall data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageBrand = () => {
    if (brandData?.brands?.[0]?.business_phone_number && selectedMedia) {
       // Fire Contact event
    const eventId = uuidv4()
    handleTikTokEvent('Contact', eventId)

      const message = `Hi! I saw this on your Brandible wall and I'm interested to learn more: ${selectedMedia.caption || selectedMedia.media_url}`;
      window.open(`https://wa.me/${brandData.brands[0].business_phone_number}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleNext = () => {
    if (selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setSelectedMedia(media[selectedIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setSelectedMedia(media[selectedIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading brand wall...</p>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className={styles.errorContainer}>
        <h2>Brand not found</h2>
        <p>The brand you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{brandData.full_name} - Brandible</title>
        <meta name="description" content={brandData.bio} />
      </Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.profileSection}>
              <img 
                src={brandData.avatar_url} 
                alt={brandData.full_name} 
                className={styles.avatar} 
              />
              <div className={styles.brandInfo}>
                <h1 className={styles.brandName}>
                  {brandData.brands?.[0]?.company_name || brandData.full_name}
                </h1>
                <p className={styles.username}>@{brandData.username}</p>
                <p className={styles.bio}>{brandData.bio}</p>
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{media.length}</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.gallery}>
          {media.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No posts yet</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {media.map((item, index) => (
                <div 
                  key={item.id} 
                  ref={(el) => { mediaRefs.current[item.id] = el; }}
                  className={styles.gridItem}
                  onClick={() => {
                    setSelectedIndex(index);
                    setSelectedMedia(item);
                  }}
                >
                  <div className={styles.mediaWrapper}>
                    {item.media_type === 'image' ? (
                      <img 
                        src={item.media_url} 
                        alt={item.caption || 'Brand wall media'} 
                        loading="lazy"
                      />
                    ) : (
                      <video src={item.media_url} />
                    )}
                  </div>
                  <div className={styles.overlay}>
                    <span className={styles.playIcon}>
                      {item.media_type === 'video' && '▶'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {selectedMedia && (
          <div className={styles.modal} onClick={() => setSelectedMedia(null)}>
            <button 
              className={styles.closeBtn}
              onClick={() => setSelectedMedia(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalMediaContainer}>
                {selectedMedia.media_type === 'image' ? (
                  <img 
                    src={selectedMedia.media_url} 
                    alt={selectedMedia.caption || 'Brand wall media'} 
                  />
                ) : (
                  <video 
                    src={selectedMedia.media_url} 
                    controls 
                    autoPlay
                  />
                )}
              </div>

              <div className={styles.modalInfo}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalProfile}>
                    <img 
                      src={brandData.avatar_url} 
                      alt={brandData.full_name}
                      className={styles.modalAvatar}
                    />
                    <div>
                      <p className={styles.modalBrandName}>
                        {brandData.brands?.[0]?.company_name || brandData.full_name}
                      </p>
                      <p className={styles.modalUsername}>@{brandData.username}</p>
                    </div>
                  </div>
                </div>

                {selectedMedia.caption && (
                  <p className={styles.caption}>{selectedMedia.caption}</p>
                )}

                <div className={styles.modalFooter}>
                  <button 
                    onClick={handleMessageBrand} 
                    className={styles.messageBtn}
                  >
                    Message Brand
                  </button>
                </div>

                <div className={styles.navigation}>
                  <button 
                    onClick={handlePrev}
                    disabled={selectedIndex === 0}
                    className={styles.navBtn}
                  >
                    ←
                  </button>
                  <span className={styles.counter}>
                    {selectedIndex + 1} / {media.length}
                  </span>
                  <button 
                    onClick={handleNext}
                    disabled={selectedIndex === media.length - 1}
                    className={styles.navBtn}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}