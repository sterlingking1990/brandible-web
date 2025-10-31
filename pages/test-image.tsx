import React from 'react';

export default function TestImagePage() {
  const imageUrl = 'https://pmquvzmgokmavmyotgsv.supabase.co/storage/v1/object/public/brand-wall/f6d44620-a917-4bee-b51d-29843ea0a667/1761862185506.jpeg';

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Image Test Page</h1>
      <p>Attempting to load the following image:</p>
      <p>{imageUrl}</p>
      <img src={imageUrl} alt="Test Image" style={{ maxWidth: '100%', marginTop: '1rem' }} />
    </div>
  );
}
