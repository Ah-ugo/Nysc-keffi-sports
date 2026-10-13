import heroKeffiCamp from '../assets/images/hero_keffi_camp_parade_1791913249841.jpg';
import compFootball from '../assets/images/comp_platoon_football_1791913250802.jpg';
import compVolleyball from '../assets/images/comp_platoon_volleyball_1791913251022.jpg';
import compCultural from '../assets/images/comp_cultural_carnival_1791913251791.jpg';
import compMarchPast from '../assets/images/comp_march_past_drill_1791913250761.jpg';

export type CloudinaryTransformPreset =
  | 'hero'
  | 'card'
  | 'mobile'
  | 'admin_preview';

export interface CloudinaryAsset {
  imageUrl: string;
  imagePublicId: string;
  label: string;
}

export const CAMP_MEDIA_LIBRARY: Record<string, CloudinaryAsset> = {
  hero: {
    imageUrl: heroKeffiCamp,
    imagePublicId: 'keffi_camp/media/hero_keffi_camp_parade_2026',
    label: 'Keffi Orientation Camp Parade Ground & Pitch',
  },
  football: {
    imageUrl: compFootball,
    imagePublicId: 'keffi_camp/competitions/platoon_football_final_2026',
    label: 'Inter-Platoon Football Tournament',
  },
  volleyball: {
    imageUrl: compVolleyball,
    imagePublicId: 'keffi_camp/competitions/platoon_volleyball_2026',
    label: 'Inter-Platoon Volleyball Championship',
  },
  cultural: {
    imageUrl: compCultural,
    imagePublicId: 'keffi_camp/competitions/cultural_carnival_dance_2026',
    label: 'Cultural Carnival & Traditional Dance',
  },
  drill: {
    imageUrl: compMarchPast,
    imagePublicId: 'keffi_camp/competitions/march_past_and_tug_of_war_2026',
    label: 'March-Past Parade Drill & Tug of War',
  },
};

const TRANSFORM_MAP: Record<CloudinaryTransformPreset, string> = {
  hero: 'f_auto,q_auto,c_fill,g_auto,w_1600,h_900',
  card: 'f_auto,q_auto,c_fill,g_auto,w_800,h_600',
  mobile: 'f_auto,q_auto,c_fill,g_auto,w_600,h_450',
  admin_preview: 'f_auto,q_auto,c_fill,g_auto,w_320,h_240',
};

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'nohyefdw',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '441471982266462',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'keffi_camp_unsigned',
};

/**
 * Builds optimized Cloudinary transformation URLs or falls back cleanly to local assets.
 */
export function getCloudinaryOptimizedUrl(
  imageUrl: string,
  imagePublicId: string,
  preset: CloudinaryTransformPreset = 'card'
): string {
  const transform = TRANSFORM_MAP[preset];

  if (imageUrl && imageUrl.includes('res.cloudinary.com') && imageUrl.includes('/upload/')) {
    return imageUrl.replace('/upload/', `/upload/${transform}/`);
  }

  if (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.startsWith('http'))) {
    return imageUrl;
  }

  if (CLOUDINARY_CONFIG.cloudName && imagePublicId) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transform}/${imagePublicId}`;
  }

  return CAMP_MEDIA_LIBRARY.football.imageUrl;
}

/**
 * Uploads media to Cloudinary using an unsigned upload preset.
 * No API secrets are exposed on the client.
 */
export async function uploadMediaToCloudinary(
  file: File
): Promise<{ imageUrl: string; imagePublicId: string; transformationPreviewUrl: string }> {
  const sanitizedBase = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40);

  if (CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
      formData.append('folder', 'keffi_camp/competitions');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          secure_url: string;
          public_id: string;
        };

        return {
          imageUrl: data.secure_url,
          imagePublicId: data.public_id,
          transformationPreviewUrl: getCloudinaryOptimizedUrl(
            data.secure_url,
            data.public_id,
            'admin_preview'
          ),
        };
      }
    } catch {
      // Fallback to local data URL if network/preset is not configured yet
    }
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });

  const generatedPublicId = `keffi_camp/competitions/${sanitizedBase}_${Date.now()}`;
  return {
    imageUrl: dataUrl,
    imagePublicId: generatedPublicId,
    transformationPreviewUrl: dataUrl,
  };
}
