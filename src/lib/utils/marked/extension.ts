// Helper function to find matching closing tag
function findMatchingClosingTag(src: string, openTag: string, closeTag: string): number {
	let depth = 1;
	let index = openTag.length;
	while (depth > 0 && index < src.length) {
		if (src.indexOf(openTag, index) === index) {
			depth++;
		} else if (src.indexOf(closeTag, index) === index) {
			depth--;
		}
		if (depth > 0) {
			index++;
		}
	}
	return depth === 0 ? index + closeTag.length : -1;
}

// Function to parse attributes from tag
function parseAttributes(tag: string): { [key: string]: string } {
	const attributes: { [key: string]: string } = {};
	const attrRegex = /(\w+)="(.*?)"/g;
	let match;
	while ((match = attrRegex.exec(tag)) !== null) {
		attributes[match[1]] = match[2];
	}
	return attributes;
}

function detailsTokenizer(src: string) {
	// Updated regex to capture attributes inside <details>
	const detailsRegex = /^<details(\s+[^>]*)?>\n/;
	const summaryRegex = /^<summary>(.*?)<\/summary>\n/;

	const detailsMatch = detailsRegex.exec(src);
	if (detailsMatch) {
		const endIndex = findMatchingClosingTag(src, '<details', '</details>');
		if (endIndex === -1) return;

		const fullMatch = src.slice(0, endIndex);
		const detailsTag = detailsMatch[0];
		const attributes = parseAttributes(detailsTag); // Parse attributes from <details>

		let content = fullMatch.slice(detailsTag.length, -10).trim(); // Remove <details> and </details>
		let summary = '';

		const summaryMatch = summaryRegex.exec(content);
		if (summaryMatch) {
			summary = summaryMatch[1].trim();
			content = content.slice(summaryMatch[0].length).trim();
		}

		return {
			type: 'details',
			raw: fullMatch,
			summary: summary,
			text: content,
			attributes: attributes // Include extracted attributes from <details>
		};
	}
}

function detailsStart(src: string) {
	return src.match(/^<details>/) ? 0 : -1;
}

function detailsRenderer(token: any) {
	const attributesString = token.attributes
		? Object.keys(token.attributes)
				.map((key) => `${key}="${token.attributes[key]}"`)
				.join(' ')
		: '';

	return `<details ${attributesString}>
  ${token.summary ? `<summary>${token.summary}</summary>` : ''}
  ${token.text}
  </details>`;
}

// Extension wrapper function
function detailsExtension() {
	return {
		name: 'details',
		level: 'block',
		start: detailsStart,
		tokenizer: detailsTokenizer,
		renderer: detailsRenderer
	};
}

interface TokenizerThis {
    lexer: {
        blockTokens(text: string): any[];
    };
}

function thinkTokenizer(this: TokenizerThis, src: string) {
	const thinkRegex = /^<think>([\s\S]*?)<\/think>/;
	const match = thinkRegex.exec(src);
	if (match) {
		const fullMatch = match[0];
		const content = match[1].trim();
		return {
			type: 'think',
			raw: fullMatch,
			text: content,
			tokens: this.lexer.blockTokens(content)
		};
	}
}

function thinkStart(src: string) {
	return src.indexOf('<think>') === 0 ? 0 : -1;
}

function thinkRenderer(token: any) {
	return `<think>${token.text}</think>`;
}

function thinkExtension() {
	return {
		name: 'think',
		level: 'block',
		start: thinkStart,
		tokenizer: thinkTokenizer,
		renderer: thinkRenderer
	};
}

export default function () {
	return {
		extensions: [detailsExtension(), thinkExtension()]
	};
}
