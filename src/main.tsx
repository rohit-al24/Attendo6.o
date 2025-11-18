import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import "./index.css";

// Render a friendly error message into the document so production deployments don't show a white screen
function renderFatalError(err: any) {
	try {
		const rootEl = document.getElementById('root');
		if (rootEl) {
			const pre = document.createElement('pre');
			pre.style.whiteSpace = 'pre-wrap';
			pre.style.wordBreak = 'break-word';
			pre.style.background = '#fff4f4';
			pre.style.color = '#8b0000';
			pre.style.padding = '16px';
			pre.style.border = '1px solid #f5c2c7';
			pre.style.borderRadius = '8px';
			pre.style.margin = '24px';
			pre.textContent = `An unexpected error occurred while loading the app:\n\n${err && err.stack ? err.stack : String(err)}`;
			// Clear existing UI and show the error
			document.body.innerHTML = '';
			const container = document.createElement('div');
			container.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
			const heading = document.createElement('h1');
			heading.textContent = 'Application Error';
			heading.style.color = '#b91c1c';
			heading.style.margin = '24px';
			container.appendChild(heading);
			container.appendChild(pre);
			document.body.appendChild(container);
		}
	} catch (e) {
		// swallow
		// eslint-disable-next-line no-console
		console.error('Failed to render fatal error UI', e);
	}
}

// Global error handlers to surface uncaught errors/rejections
window.addEventListener('error', (ev) => {
	// ev.error may be undefined in some cases
	renderFatalError(ev.error || ev.message || 'Unknown runtime error');
});
window.addEventListener('unhandledrejection', (ev) => {
	renderFatalError(ev.reason || 'Unhandled promise rejection');
});

try {
	// If building for production, ensure required runtime env variables are present (helpful on Netlify/GitHub Pages)
	const isProduction = import.meta.env.MODE === 'production';
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
	if (isProduction && (!supabaseUrl || !supabaseKey)) {
		// Show an instructional message so deploys don't appear as a white screen
		const rootEl = document.getElementById('root');
		if (rootEl) {
			document.body.innerHTML = '';
			const container = document.createElement('div');
			container.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
			container.style.padding = '24px';
			const heading = document.createElement('h1');
			heading.textContent = 'Missing environment configuration';
			heading.style.color = '#b91c1c';
			heading.style.marginBottom = '12px';
			const p = document.createElement('p');
			p.textContent = 'The app requires Supabase environment variables but they were not found at build/runtime.';
			const ul = document.createElement('ul');
			ul.style.marginTop = '12px';
			const li1 = document.createElement('li');
			li1.textContent = 'VITE_SUPABASE_URL';
			const li2 = document.createElement('li');
			li2.textContent = 'VITE_SUPABASE_ANON_KEY';
			ul.appendChild(li1);
			ul.appendChild(li2);
			const help = document.createElement('p');
			help.style.marginTop = '12px';
			help.innerHTML = 'Set these variables in your hosting provider (e.g. Netlify -> Site settings -> Build & deploy -> Environment) and rebuild the site.';
			container.appendChild(heading);
			container.appendChild(p);
			container.appendChild(ul);
			container.appendChild(help);
			document.body.appendChild(container);
		}
	} else {
		createRoot(document.getElementById('root')!).render(
			<AuthProvider>
				<App />
			</AuthProvider>
		);
	}
} catch (err) {
	// Catch synchronous render-time errors
	renderFatalError(err);
}
