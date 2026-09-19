import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

export default withNextra({
  output: 'export',               // Strictly enforces $0 static HTML generation
  images: { unoptimized: true },  // Required for next export to succeed
})