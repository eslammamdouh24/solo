import { supabase } from "@/lib/supabase";

const fetchImageAsArrayBuffer = async (imageUri: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return new Response(blob).arrayBuffer();
};

export const uploadAvatarToStorage = async (
  userId: string,
  imageUri: string,
) => {
  const fileExt = imageUri.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = `${userId}/avatar.${fileExt}`;
  const arrayBuffer = await fetchImageAsArrayBuffer(imageUri);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, arrayBuffer, {
      contentType: `image/${fileExt}`,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
};
