'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect } from 'react';

type AnimatedLinkProps = React.ComponentProps<typeof Link> & {
  href: string;
};

type TransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

export function navigateWithTransition(router: ReturnType<typeof useRouter>, href: string) {
  const doc = document as TransitionDocument;
  document.documentElement.classList.add('lh-routing');

  const navigate = () => router.push(href);

  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(navigate);
  } else {
    navigate();
  }

  window.setTimeout(() => {
    document.documentElement.classList.remove('lh-routing');
  }, 260);
}

const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(function AnimatedLink(
  { href, onClick, className, ...props },
  ref,
) {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.remove('lh-routing');
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={className ? `${className} lh-transition-link` : 'lh-transition-link'}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === '_blank'
        ) {
          return;
        }

        event.preventDefault();
        navigateWithTransition(router, href);
      }}
      {...props}
    />
  );
});

export default AnimatedLink;
