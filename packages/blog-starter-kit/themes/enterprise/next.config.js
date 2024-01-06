const { request, gql } = require('graphql-request');

const ANALYTICS_BASE_URL = 'https://hn-ping2.hashnode.com';
const ADVANCED_ANALYTICS_BASE_URL = 'https://stats.hashnode.com';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;

const getBasePath = () => {
	if (BASE_URL && BASE_URL.indexOf('/') !== -1) {
		return BASE_URL.substring(BASE_URL.indexOf('/'));
	}
	return undefined;
};

const getRedirectionRules = async () => {
	const query = gql`
		query GetRedirectionRules {
			publication(host: "${host}") {
				id
				redirectionRules {
					source
					destination
					type
				}
			}
		}
  	`;

	const data = await request(GQL_ENDPOINT, query);

	if (!data.publication) {
		throw new Error('Please ensure you have set the env var NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST correctly.');
	}

	const redirectionRules = data.publication.redirectionRules;

	// convert to next.js redirects format
	const redirects = redirectionRules
		.filter((rule) => rule.source.indexOf('*') === -1)
		.map((rule) => ({
			source: rule.source,
			destination: rule.destination,
			permanent: rule.type === 'PERMANENT',
		}));

	return redirects;
};

/**
 * @type {import('next').NextConfig}
 */
const config = {
	transpilePackages: ['@starter-kit/utils'],
	basePath: getBasePath(),
	experimental: {
		scrollRestoration: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.hashnode.com',
			},
		],
	},
	async rewrites() {
		return [
			{
				source: '/ping/data-event',
				destination: `${ANALYTICS_BASE_URL}/api/data-event`,
			},
			{
				source: '/ping/view',
				destination: `${ANALYTICS_BASE_URL}/api/view`,
			},
			{
				source: '/api/collect',
				destination: `${ADVANCED_ANALYTICS_BASE_URL}/api/collect`,
			},
		];
	},
	async redirects() {
		return await getRedirectionRules();
	},
	rewrites: async () => [
		{
			source: "/blog",
			destination: "https://starter-kit-three-theta.vercel.app/blog",
		},
		{
			source: "/blog/:path*",
			destination: "https://starter-kit-three-theta.vercel.app/blog/:path*",
		},
	],
};

module.exports = config;
