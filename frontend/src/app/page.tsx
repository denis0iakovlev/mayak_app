import { Gallery } from "@/components/Gallery";
import { getGalleryImages } from "@/lib/getGalleryImages";

export default function Home() {
  const images = getGalleryImages();
  return (
    <section className="space-y-6 ">
      <h1 >Наши корты</h1>
      <Gallery images={images}/>
    </section>
  );
}
