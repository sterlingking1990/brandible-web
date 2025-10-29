
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function DeepLinkTest() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const { referrer_id, status_id } = router.query;

      if (referrer_id && status_id) {
        const deepLink = `brandible://share?referrer_id=${referrer_id}&status_id=${status_id}`;
        window.location.href = deepLink;
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div>
      <h1>Brandible Deep Link Test</h1>
      <p>Attempting to open the Brandible app...</p>
    </div>
  );
}
