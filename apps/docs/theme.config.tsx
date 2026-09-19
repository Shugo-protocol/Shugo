export default {
  logo: (
    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem' }}>
      shugo / 守護
    </span>
  ),
  project: {
    link: 'https://github.com',
  },
  docsRepositoryBase: 'https://github.com/your-username/shugo/tree/main/apps/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – shugo docs'
    }
  },
  primaryHue: 0,
  primarySaturation: 0, // This forces the entire Nextra site into black/white/gray
  footer: {
    text: (
      <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} shugo protocol. zero-custody delegation on solana.
      </span>
    )
  }
}