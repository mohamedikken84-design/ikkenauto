import Image from "next/image";
import Link from "next/link";

/** A single non-breaking IKKENAUTO wordmark for every dealer portal screen. */
export function PortalLogo(){
 return <Link href="/portal" className="portal-brand" aria-label="IKKENAUTO dealerportaal">
  <Image src="/ikkenauto-wordmark.svg" alt="IKKENAUTO" className="portal-brand-image" width={390} height={70} priority unoptimized/>
 </Link>;
}
