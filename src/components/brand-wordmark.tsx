import Image from "next/image";

export function BrandWordmark() {
  return (
    <span className="brand-wordmark" aria-hidden="true">
      <Image
        src="/media/brand/dandrade-dev-light.png"
        alt=""
        width={136}
        height={24}
        priority
        className="brand-wordmark-img brand-wordmark-light"
      />
      <Image
        src="/media/brand/dandrade-dev-dark.png"
        alt=""
        width={136}
        height={24}
        priority
        className="brand-wordmark-img brand-wordmark-dark"
      />
    </span>
  );
}
