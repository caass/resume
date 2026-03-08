# Resume

I got sick and tired of having to re-learn Microsoft Word's archaic system for columns, spacing, and padding every time I started job hunting. "Wait," I though to myself, "I already _know_ an archiac system for columns, spacing and padding! It's called Cascading Style Sheets!" And thus, I rewrote my entire resume into JSX.

This repository contains both the contents and the layout of my resume, written using [Astro](https://astro.build) and rendered to PDF using [Puppeteer](https://pptr.dev) (via [astro-pdf](https://github.com/lameuler/astro-pdf)). The resume content itself lives in MDX and YAML files, which Astro ingests and renders into a static page before Puppeteer converts it to PDF.

P.S. If you find the contents of this resume enticing, shoot me an email! You can contact me through my website, [swag.LGBT](https://swag.lgbt).

P.P.S. If you want to re-use this project for your own resume, feel free to fork. There's definitely better resume builders out there, however.
