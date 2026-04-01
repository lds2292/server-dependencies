<template>
  <footer class="public-footer">
    <div class="public-footer-inner">
      <p class="public-footer-contact">{{ $t('common.footer.contact') }}</p>
      <a :href="`mailto:${$t('common.footer.email')}`" class="public-footer-email">
        {{ $t('common.footer.email') }}
      </a>
      <div class="public-footer-divider"></div>
      <p class="public-footer-copyright">
        {{ $t('common.footer.copyright', { year: new Date().getFullYear() }) }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  border-top: 1px solid var(--border-default);
  padding: 48px 1.5rem;
  text-align: center;
  scroll-snap-align: end;
}
.public-footer-inner {
  max-width: 72rem;
  margin: 0 auto;
}
.public-footer-contact {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 12px 0;
  line-height: 1.6;
}
.public-footer-email {
  display: inline-block;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--accent-primary);
  text-decoration: none;
  transition: color 0.15s;
}
.public-footer-email:hover {
  color: var(--accent-focus);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.public-footer-divider {
  width: 60px;
  height: 1px;
  background: var(--border-subtle);
  margin: 24px auto;
}
.public-footer-copyright {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  margin: 0;
}
@media (max-width: 767px) {
  .public-footer {
    padding: 32px 1.5rem;
  }
}
</style>
