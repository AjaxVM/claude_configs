# Writing Style Reference

This file is a personal reference for how I write. It's separate from the punctuation rules in CLAUDE.md's "Prose Style" section (those still apply). Use this specifically when drafting docs, READMEs, explanations, or other non-technical prose in my voice, not for code or code comments.

**Note to Claude:** if I give direct feedback on phrasing, structure, or framing while working on something, proactively suggest adding a note here so it carries into future sessions instead of staying session-only.

## Sentence structure & rhythm

I tend to write sentences that are long and verbose, with a heavy use of analogies (and comparisons in general), parentheses for impactful related notes, and commas to separate ideas.

When explaining multi-part ideas, I quickly break into bullets:
- Like this
- Or when I want to describe something that happens in steps
  - I will also nest bullets to break them up
  - and provide visual relief and cues about structure and relatedness

I tend to spend a fair amount of time finding "the right word" - as the specific nuances that differentiate otherwise identical synonyms is important to me. I also heavily edit for clarity, spending time reading aloud the sentences and paragraphs to ensure that they read clearly, and also have properly conveyed inflection and pause points, where an audible speaker would insert emphasis in pauses or pronunciation.

I often will restate something a second time in a slightly different way (or lean back into that analogy), to ensure that readers how two frames of reference to clearly understand. NOTE: importantly, when writing technical documentation or highly structured documents (resumes, READMEs, etc.) I will do far less restating, unless it meaningfully improves clarity - instad opting for a lot of refinement to get it "technically right" in one sentence.

I tend to avoid paragraphs that span beyond 4-5 lines of about 80-120 characters a piece - if a single sentence grows that large I will let it be the whole paragrpah or start reframing it into split sentences.

These sentences themselves are a good example of sentences I would normally write as well.

I use emphasis markers a lot (italics, bolding, quotes, etc.) as well as Headers and Sections when available.
For example, in Markdown or word docs, I will use header/subheader/heading 3, etc. for section in a hierachical way. In an email that might have less support for them, I will still tend to differentiate headers and such with a prefix or wrapping characters, such as "# Some header", "=Some Header=", etc.

I will use an asterisk as a trailing indicator that something was edited, has further notes, etc. - usually not falling back to other characters for references unless absolutely needed - though when I do I will describe the structure/format clearly for the user.

## Word choice / verbiage

- Be specific - surprisingly few words in English are literally the exact same meaning, either carrying colloquial, implied or contextual meaning that another word does not - and when they are not literally the same meaning, that nuance in difference is important
- Favor words that help a sentence flow - a super long, hard to pronounce word is also difficult to read, only pull these in for dramatic impact or when they absolutely just are the best word for the case
- I will often pick a word that is the best fit early, and keep that as the main way of describing that concept throughout a document - only deviating when there is a specific reason, suchas:
  - it feels stale
  - I want to convey a slightly different usage
  - when I am emphasizing that the specific word is not the point, but the idea moreso
  - when I am using analogies or examples (this is a key area where I intentionally vary the words)
- I take great care to avoid using terms or phrases that are easily read as condescending, offensive or otherwise are prone to accidental misunderstanding
- I heavily prefer commas, basic dashes and parentheses for long sentences or for impact, along with italic and bold markers. I do not utilize em-dashes almost ever in my writing, and semicolons are very rare. Colons are reserver for lists, which I will inline (comma separated, with parentheses for description if longer than 1-2 words) or fall back to the bullet-style

## Framing

Lead with what something *gains* or *is*, not a list of what it lacks or avoids. A contrast with a rejected alternative can support the point, but shouldn't open the paragraph or sentence - state the positive property and its benefit first.