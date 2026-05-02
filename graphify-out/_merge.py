import json
from pathlib import Path

all_nodes, all_edges, all_hyperedges = [], [], []

ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
all_nodes.extend(ast.get('nodes', []))
all_edges.extend(ast.get('edges', []))

chunk_1 = {
  'nodes': [
    {'id': 'postcss_config', 'label': 'PostCSS Config', 'file_type': 'code'},
    {'id': 'next_env_dts', 'label': 'Next.js Type Declarations', 'file_type': 'code'},
    {'id': 'proxy_ts', 'label': 'Rate-Limit Proxy Middleware', 'file_type': 'code'},
    {'id': 'eslint_config', 'label': 'ESLint Config', 'file_type': 'code'},
    {'id': 'next_config', 'label': 'Next.js Config', 'file_type': 'code'},
    {'id': 'app_layout', 'label': 'Root Layout', 'file_type': 'code'},
    {'id': 'app_page', 'label': 'Home Page (/ redirect target)', 'file_type': 'code'},
    {'id': 'thank_you_page', 'label': 'Thank You Page', 'file_type': 'code'},
    {'id': 'free_local_seo_page', 'label': 'Free Local SEO Audit Page', 'file_type': 'code'},
    {'id': 'site_footer', 'label': 'SiteFooter', 'file_type': 'code'},
    {'id': 'site_footer_minimal', 'label': 'SiteFooterMinimal', 'file_type': 'code'},
    {'id': 'site_nav_minimal', 'label': 'SiteNavMinimal', 'file_type': 'code'},
    {'id': 'hero_section', 'label': 'HeroSection', 'file_type': 'code'},
    {'id': 'diagnostic_grid', 'label': 'DiagnosticGrid', 'file_type': 'code'},
    {'id': 'trust_bar', 'label': 'TrustBar', 'file_type': 'code'},
    {'id': 'how_it_works', 'label': 'HowItWorksSection', 'file_type': 'code'},
    {'id': 'what_we_check', 'label': 'WhatWeCheckSection', 'file_type': 'code'},
    {'id': 'report_preview', 'label': 'ReportPreviewSection', 'file_type': 'code'},
    {'id': 'faq_section', 'label': 'FaqSection', 'file_type': 'code'},
    {'id': 'final_cta', 'label': 'FinalCtaSection', 'file_type': 'code'},
    {'id': 'testimonials', 'label': 'TestimonialsSection', 'file_type': 'code'},
    {'id': 'audit_tool', 'label': 'AuditTool', 'file_type': 'code'},
    {'id': 'audit_module_css', 'label': 'audit.module.css', 'file_type': 'code'},
    {'id': 'landing_module_css', 'label': 'landing.module.css', 'file_type': 'code'},
    {'id': 'site_footer_module_css', 'label': 'SiteFooter.module.css', 'file_type': 'code'},
    {'id': 'site_footer_minimal_module_css', 'label': 'SiteFooterMinimal.module.css', 'file_type': 'code'},
    {'id': 'site_nav_module_css', 'label': 'SiteNav.module.css', 'file_type': 'code'},
    {'id': 'thank_you_module_css', 'label': 'thankYou.module.css', 'file_type': 'code'},
    {'id': 'globals_css', 'label': 'globals.css', 'file_type': 'code'},
    {'id': 'tailwindcss', 'label': 'Tailwind CSS (PostCSS plugin)', 'file_type': 'code'},
    {'id': 'upstash_ratelimit', 'label': 'Upstash Ratelimit', 'file_type': 'code'},
    {'id': 'upstash_redis', 'label': 'Upstash Redis', 'file_type': 'code'},
    {'id': 'framer_motion', 'label': 'Framer Motion', 'file_type': 'code'},
    {'id': 'api_audit_route', 'label': 'API Route: /api/audit', 'file_type': 'code'}
  ],
  'edges': [
    {'source': 'postcss_config', 'target': 'tailwindcss', 'relation': 'configures_plugin', 'confidence': 'EXTRACTED'},
    {'source': 'next_config', 'target': 'free_local_seo_page', 'relation': 'redirects_root_to', 'confidence': 'EXTRACTED'},
    {'source': 'proxy_ts', 'target': 'upstash_ratelimit', 'relation': 'uses_for_rate_limiting', 'confidence': 'EXTRACTED'},
    {'source': 'proxy_ts', 'target': 'upstash_redis', 'relation': 'connects_to', 'confidence': 'EXTRACTED'},
    {'source': 'proxy_ts', 'target': 'api_audit_route', 'relation': 'guards_with_rate_limit', 'confidence': 'EXTRACTED'},
    {'source': 'app_layout', 'target': 'globals_css', 'relation': 'imports', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'site_nav_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'hero_section', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'trust_bar', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'how_it_works', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'what_we_check', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'testimonials', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'faq_section', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'final_cta', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'site_footer_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'app_page', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'site_nav_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'site_footer_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'hero_section', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'diagnostic_grid', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'trust_bar', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'how_it_works', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'report_preview', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'testimonials', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'final_cta', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'free_local_seo_page', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'thank_you_page', 'target': 'site_nav_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'thank_you_page', 'target': 'site_footer_minimal', 'relation': 'renders', 'confidence': 'EXTRACTED'},
    {'source': 'thank_you_page', 'target': 'thank_you_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'hero_section', 'target': 'audit_tool', 'relation': 'embeds', 'confidence': 'EXTRACTED'},
    {'source': 'hero_section', 'target': 'framer_motion', 'relation': 'uses_for_animation', 'confidence': 'EXTRACTED'},
    {'source': 'hero_section', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'diagnostic_grid', 'target': 'framer_motion', 'relation': 'uses_for_animation', 'confidence': 'EXTRACTED'},
    {'source': 'diagnostic_grid', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'audit_tool', 'target': 'api_audit_route', 'relation': 'posts_to', 'confidence': 'INFERRED'},
    {'source': 'audit_tool', 'target': 'framer_motion', 'relation': 'uses_for_animation', 'confidence': 'EXTRACTED'},
    {'source': 'audit_tool', 'target': 'audit_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'site_footer', 'target': 'site_footer_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'site_footer_minimal', 'target': 'site_footer_minimal_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'site_nav_minimal', 'target': 'site_nav_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'site_nav_minimal', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'trust_bar', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'how_it_works', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'what_we_check', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'report_preview', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'faq_section', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'final_cta', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'testimonials', 'target': 'landing_module_css', 'relation': 'imports_styles_from', 'confidence': 'EXTRACTED'},
    {'source': 'eslint_config', 'target': 'next_env_dts', 'relation': 'ignores_generated_file', 'confidence': 'EXTRACTED'},
    {'source': 'app_layout', 'target': 'free_local_seo_page', 'relation': 'wraps_as_child', 'confidence': 'INFERRED'},
    {'source': 'app_layout', 'target': 'thank_you_page', 'relation': 'wraps_as_child', 'confidence': 'INFERRED'}
  ],
  'hyperedges': [
    {'id': 'landing_page_components', 'label': 'Landing Page Component Set', 'members': ['hero_section', 'trust_bar', 'how_it_works', 'what_we_check', 'report_preview', 'testimonials', 'faq_section', 'final_cta', 'diagnostic_grid'], 'relation': 'compose_landing_page', 'confidence': 'EXTRACTED'},
    {'id': 'shared_chrome', 'label': 'Shared Page Chrome', 'members': ['site_nav_minimal', 'site_footer_minimal'], 'relation': 'appear_on_every_page', 'confidence': 'EXTRACTED'}
  ]
}

chunk_2 = {'nodes':[{'id':'site_nav','label':'SiteNav Component','file_type':'code'},{'id':'shared_audit_view','label':'SharedAuditView Component','file_type':'code'},{'id':'audit_page','label':'Audit Detail Page','file_type':'code'},{'id':'api_email_route','label':'POST /api/email Route','file_type':'code'},{'id':'lib_prefetch','label':'Pre-Fetch Pipeline (lib/prefetch.ts)','file_type':'code'},{'id':'lib_ratelimit','label':'Rate Limiter (lib/ratelimit.ts)','file_type':'code'},{'id':'lib_supabase','label':'Supabase Client (lib/supabase.ts)','file_type':'code'},{'id':'lib_audit_pdf','label':'AuditPdf Component (lib/AuditPdf.tsx)','file_type':'code'},{'id':'readme','label':'README','file_type':'document'},{'id':'agents_md','label':'AGENTS.md Agent Rules','file_type':'document'},{'id':'build_spec','label':'Build Spec (docs/build-spec.md)','file_type':'document'},{'id':'img_map_pack','label':'Map Pack Visibility Image','file_type':'image'},{'id':'img_step1','label':'Step 1 Visual','file_type':'image'},{'id':'img_step2','label':'Step 2 Visual','file_type':'image'},{'id':'img_step3','label':'Step 3 Visual','file_type':'image'},{'id':'img_testimonials','label':'Testimonial Avatars','file_type':'image'},{'id':'img_og','label':'OG Image','file_type':'image'},{'id':'img_audit_preview','label':'Audit Report Preview Image','file_type':'image'},{'id':'img_how_it_works','label':'How It Works Steps Image','file_type':'image'},{'id':'img_visibility','label':'Visibility Transformation Image','file_type':'image'},{'id':'svc_anthropic','label':'Anthropic Claude API','file_type':'code'},{'id':'svc_supabase','label':'Supabase Database','file_type':'code'},{'id':'svc_resend','label':'Resend Email Service','file_type':'code'},{'id':'svc_upstash','label':'Upstash Redis (Rate Limiting)','file_type':'code'},{'id':'svc_google_places','label':'Google Places API','file_type':'code'},{'id':'svc_pagespeed','label':'PageSpeed Insights API','file_type':'code'},{'id':'svc_serper','label':'Serper.dev Search API','file_type':'code'},{'id':'svc_dataforseo','label':'DataForSEO API','file_type':'code'},{'id':'svc_localsearchally','label':'LocalSearchAlly Main Site','file_type':'document'}],'edges':[{'source':'audit_page','target':'shared_audit_view','relation':'renders','confidence':'EXTRACTED'},{'source':'audit_page','target':'lib_supabase','relation':'fetches audit record via','confidence':'EXTRACTED'},{'source':'api_audit_route','target':'lib_prefetch','relation':'calls parallel pre-fetch via','confidence':'EXTRACTED'},{'source':'api_audit_route','target':'lib_ratelimit','relation':'enforces IP rate limiting via','confidence':'EXTRACTED'},{'source':'api_audit_route','target':'lib_supabase','relation':'persists audit result to','confidence':'EXTRACTED'},{'source':'api_audit_route','target':'svc_anthropic','relation':'calls for AI audit generation','confidence':'EXTRACTED'},{'source':'api_email_route','target':'lib_audit_pdf','relation':'renders PDF using','confidence':'EXTRACTED'},{'source':'api_email_route','target':'svc_resend','relation':'sends email via','confidence':'EXTRACTED'},{'source':'api_email_route','target':'lib_supabase','relation':'reads audit record from','confidence':'EXTRACTED'},{'source':'lib_prefetch','target':'svc_google_places','relation':'fetches GBP data from','confidence':'EXTRACTED'},{'source':'lib_prefetch','target':'svc_pagespeed','relation':'fetches Core Web Vitals from','confidence':'EXTRACTED'},{'source':'lib_prefetch','target':'svc_serper','relation':'fetches map pack results from','confidence':'EXTRACTED'},{'source':'lib_prefetch','target':'svc_dataforseo','relation':'fetches backlinks and reviews from','confidence':'EXTRACTED'},{'source':'lib_ratelimit','target':'svc_upstash','relation':'uses Redis sliding window via','confidence':'EXTRACTED'},{'source':'lib_supabase','target':'svc_supabase','relation':'connects to','confidence':'EXTRACTED'},{'source':'site_nav','target':'svc_localsearchally','relation':'links to main site pages on','confidence':'EXTRACTED'},{'source':'build_spec','target':'api_audit_route','relation':'specifies behavior of','confidence':'EXTRACTED'},{'source':'build_spec','target':'api_email_route','relation':'specifies behavior of','confidence':'EXTRACTED'},{'source':'build_spec','target':'lib_prefetch','relation':'specifies pre-fetch pipeline for','confidence':'EXTRACTED'},{'source':'agents_md','target':'api_audit_route','relation':'defines coding conventions for','confidence':'EXTRACTED'},{'source':'agents_md','target':'lib_prefetch','relation':'defines coding conventions for','confidence':'INFERRED'},{'source':'shared_audit_view','target':'img_audit_preview','relation':'previews design shown in','confidence':'INFERRED'},{'source':'build_spec','target':'img_map_pack','relation':'describes feature illustrated by','confidence':'INFERRED'},{'source':'build_spec','target':'img_visibility','relation':'describes outcome illustrated by','confidence':'INFERRED'}],'hyperedges':[{'id':'prefetch_sources','label':'Pre-Fetch Data Sources','members':['svc_google_places','svc_pagespeed','svc_serper','svc_dataforseo'],'relation':'run in parallel by lib_prefetch before Claude call','confidence':'EXTRACTED'},{'id':'landing_visuals','label':'Landing Page Visual Assets','members':['img_step1','img_step2','img_step3','img_how_it_works','img_testimonials','img_map_pack','img_visibility','img_audit_preview'],'relation':'used as landing page imagery','confidence':'INFERRED'}]}

for chunk in [chunk_1, chunk_2]:
    all_nodes.extend(chunk.get('nodes', []))
    all_edges.extend(chunk.get('edges', []))
    all_hyperedges.extend(chunk.get('hyperedges', []))

merged = {'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyperedges, 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2))
print(f'Merged: {len(all_nodes)} nodes, {len(all_edges)} edges, {len(all_hyperedges)} hyperedges')
