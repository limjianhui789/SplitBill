# SplitInvoice

An easy way to split restaurant bills and track expenses with a beautiful, mobile-friendly interface.

## Features

- Split bills among multiple people
- Track expenses over time
- Save frequently used groups of people
- Create templates for common bill scenarios
- View spending statistics and trends
- Dark mode support
- Mobile-friendly design

## Getting Started

### Development

For development, you can run the app directly by opening `index.html` in your browser. The project currently uses Tailwind CSS via CDN for development ease.

### Setting up for Production

To properly set up Tailwind CSS for production (removing the CDN warning):

1. Install dependencies:
```bash
npm install
```

2. Build the CSS for production:
```bash
npm run build
```

3. In `index.html` and `statistics.html`, replace the Tailwind CDN with the compiled CSS file:
```html
<!-- Replace this: -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- With this: -->
<link rel="stylesheet" href="css/tailwind.output.css">
```

4. Remove the inline Tailwind configuration from the HTML files, as it's now in `tailwind.config.js`.

### Development with Local Tailwind

To develop with local Tailwind (better performance and no warnings):

```bash
npm run dev
```

This will watch for changes in your CSS and HTML files and update the compiled CSS automatically.

## Project Structure

- `/css` - CSS files, including custom styles
- `/js` - JavaScript modules for application logic
- `index.html` - Main application
- `statistics.html` - Statistics and charts view

## Dependencies

- Tailwind CSS - Utility-first CSS framework
- Chart.js - For data visualization in the statistics page
- Hammer.js - For touch gestures
- Font Awesome - For icons
- AOS - For scroll animations

## Browser Support

Works on modern browsers including:
- Chrome
- Firefox
- Safari
- Edge 