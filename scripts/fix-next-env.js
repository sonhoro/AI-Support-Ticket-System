const fs = require('fs')
const path = require('path')

const content = `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`
fs.writeFileSync(path.join(__dirname, '..', 'next-env.d.ts'), content, 'utf8')
console.log('next-env.d.ts restored')