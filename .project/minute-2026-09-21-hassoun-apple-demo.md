# Minute: Apple Demo Update — HLS Non-Linear Ads

Date: 2026-09-21
Participants: Nicolás Levy, David Hassoun, Emil Santurio
Project: HLS non-linear advertising demo for the Apple event of 2026-10-07 (web with hls.js + native iOS with AVFoundation), and the related SVTA specification
Tags: HLS, concurrent-interstitials, SVTA-spec, multi-view, AVFoundation, decoderCount, TestFlight

---

## Executive summary

The meeting was the first sync after David's time away. Its purpose was for David to give feedback on the demos he had reviewed on his own before the call, to agree on what the Apple event demo actually shows, and to decide who updates the SVTA specification document and by when. All three were covered.

On the demos, David's position is that the event has roughly two minutes of demo time, so the material has to be picked rather than shown in full. He wants the side-by-side comparison demo as the main piece, because it shows "how it is today" next to "how it could be" in one frame; a second, simpler demo to be shown with the browser network tab open so the manifest and the tags are visible on screen; and the racing multi-view demo at the end as the "you can take this further" closer. The demo that combines an ad and multi-view in one page is dropped, because the racing one covers the same ground better. He also asked for two additions: an ad break inside the racing demo so that a single demo shows the old capability, the new capability and the extension, and a UI control for the number of supported decoders so the audience sees the asset list responding with a different layout depending on what the device can decode.

On scope, David drew a line that will shape both the code and the specification: user-driven interaction, such as picking which camera to watch or which feed to hear, is a Qualabs extension and does not belong in the SVTA spec. He asked that the separation be visible in the code and the libraries, between the SVTA concurrent interstitial and the Qualabs enhanced one. Nicolás agreed, and had already arrived at the same split while prototyping, on the grounds that advertising is imposed by the publisher while multi-view is governed by the viewer.

On the specification, David named it as the next big item and one of the things that must be done for the event. Nicolás took the first pass, AI-assisted, with a first draft targeted for this week; David reviews afterwards, once the deck is finished. One open requirements question was resolved during the call: skipping applies to the whole ad break, not to individual ads inside it, and skipping does not compress the timeline.

## Discussion topics

### Running the demo on an iOS device at the event

Nicolás builds the iOS app on a 2011 Mac, which caps the macOS version and therefore the simulator version. Emil confirmed a newer machine is available to build and update on. David clarified he has no iPhone but does have an iPad, and said he would like the app on the iPad so he can show it to people after the presentation, ideally via TestFlight if that is easy to set up. For the main presentation his intent is different: he wants to be able to say on stage that it is working in AV Foundation and invite people to come and see it, and then run the demo itself on web, because web lets him open the network tab, show the manifest and show the tags on screen.

### Separating the SVTA specification from the Qualabs extension

Nicolás described how, while prototyping multi-view, he concluded that advertising and multi-view are two different classes of signalling: in advertising the control sits with the ad presentation server, which decides layout and audio; in multi-view the viewer is the one who wants to choose the camera and the audio feed. David agreed and went further, asking that the separation be explicit in the code and libraries so that the user-interaction capability does not flow into what goes to SVTA. The agreed default behaviour for the spec is that the player shows the quad or multi-view composition; extending it with user controls is what an implementer such as Qualabs does on top.

### Class hierarchy, for accuracy in the deck

David asked whether the concurrent interstitial class technically extends the interstitial class, since standard interstitials are supported through it. Nicolás confirmed it does. David's stated reason was making sure the deck is technically accurate.

### The deck and what the demo shows

David said he needs to rework part of the existing slides: the step-by-step section reads as disjointed and he wants it shown as a flow, with more emphasis on detection. He also said the demo material has to be scripted, in his words "we need to start fig[ur]ing out like what do we actually show and script this out". The decoder-count control came out of this thread: he wants to show that the asset list call carries how many decoders the device has, and that the response adapts, from images for an L-bar [?] on a single-decoder device up to an overlay or a squeezeback with an L-box and video where several decoders are available. He noted the ideal version would have the ad presentation server adjust dynamically, but that switching which surface is called would be enough for the demo. Nicolás said the capability is already implemented but not surfaced in the demo, and that he would make it work.

### Advertising creative shown in the demos

David asked that the placeholder and third-party content currently used as ads be replaced with something that looks like an advertisement, generating or sourcing material if needed. Nicolás proposed putting a Qualabs ad in, noting that it is an ad inside an ad. David said Emil was working on producing something. The L-shaped ad already in one of the demos was singled out by David as good as it is.

### Dismissal and skipping of non-linear ads

Nicolás raised an open point from the requirements work: whether dismissal applies to a whole slot or to each ad within it, and what happens to the remaining time if an individual ad is dismissed. David's answer was that the time period would be waited out rather than compressed, and that skipping individual ads inside a break would be a poor experience; where skipping is allowed at all, it is the whole break. Nicolás agreed. Nicolás noted the point is still open in the requirements document and suggested taking it to the next working group call [?].

### Updating the SVTA specification document

David named the specification update as the next big item, said he could also go to Olivia [?] about it, and asked whether Nicolás had the time and willingness to do an update round, offering to take it himself after the slides otherwise. Nicolás took it. David asked for a first draft this week so he can start reviewing and giving feedback, and said he would then do a full deep review, either against a redline or by diffing. He shared the link to the spec document in the meeting chat; both Nicolás and Emil had to request access to it during the call. David framed the work as merging the several separate documents back into a single spec everyone works from. Nicolás said he has been working on the requirements side, using AI to detect conflicts between requirements, and wants to see whether AI can write the spec from a good requirements document and context.

### Timeline

The presentation is on 7 October. David has a dress rehearsal starting on the 5th and the 6th. He is meeting Apple the same day as this call to go through the deck. He said the TestFlight build is not on the critical path as long as it is done before the event. Nicolás said twice that there is plenty of time.

## Key insights

- The event affords roughly two minutes of demo, which makes selection and scripting of the material a harder constraint than building more of it.
- Web is David's preferred surface for the live demo, not because of capability but because the network tab makes the manifest and the tags visible to the audience.
- The boundary between what goes to SVTA and what stays a Qualabs extension is drawn at viewer-driven interaction: the publisher-imposed composition is the spec, the viewer's control over it is the extension.

## Decisions

- Viewer-driven interaction — camera selection, per-feed audio choice — is **not** part of the SVTA spec; it is an extension on top of it, and the separation is to be visible in the code and in the libraries ("let's make sure that we separate those out because I don't want that capability going towards this for now and I want to keep that separate." — David; "I agree with you. Yeah, I agree with you." — Nicolás) — owner: Nicolás — deadline: Not specified
- Skipping applies to the **whole ad break**, not to individual ads inside it, and it does not compress the timeline; the time period is waited out ("it'd be the whole ad break." — David; "Add break. Yeah. All uh break skip. I like it." — Nicolás) — owner: Nicolás, for the requirements and spec — deadline: Not specified
- Confirmed for the deck: the concurrent interstitial class extends the interstitial class ("is it accurate to say that that class extends that?" — David; "Yes. […] Exactly." — Nicolás) — owner: David — deadline: Not specified
- Demo lineup for the event: the side-by-side comparison demo is the main piece; the simpler single-player demo is the one shown with the network tab and the manifest; the racing multi-view demo closes as "this is how you can take it further"; the demo combining an ad and multi-view in one page is dropped ("which I think the racing one's far better than this. So, I wouldn't do that one." — David) — owner: David — deadline: Not specified
- An ad break is added to the racing multi-view demo, containing an overlay, a regular interstitial and a concurrent double-box, so that one demo shows the existing capability, the new one and the extension ("do it where there's an ad break that has, you know, an overlay, a regular interstitial and then also a double box or something. That way we can show everything" — David) — owner: Nicolás — deadline: Not specified
- Nicolás takes the first pass at updating the SVTA specification document, AI-assisted; David reviews afterwards ("I have time. I have time to do it." — Nicolás) — owner: Nicolás — deadline: first draft this week ("if you can have something this week, that would be amazing" — David)
- The TestFlight build targets David's **iPad**, not an iPhone, and is explicitly not on the critical path, required only before the event ("that's not on critical path, but be freaking awesome […] As long as we can have that done before the actual event, should be fine." — David) — owner: Emil — deadline: before 2026-10-07

## Important details

- The event is on 2026-10-07. David's dress rehearsal starts on the 5th and runs into the 6th.
- Demo time at the event is approximately two minutes.
- David does not have an iPhone; he has an iPad. Any on-device demo he holds himself is an iPad.
- Nicolás's Mac is from 2011 and caps the macOS version, and therefore the simulator version, he can build with. Emil confirmed a newer machine is available ("in theory we can run it and update it on a[n Emil] computer." — Nicolás; "Yes." — Emil).
- The SVTA spec document link was posted in the meeting chat. Nicolás and Emil both requested access during the call; access had not been granted by the end of the meeting.
- David is meeting Apple on 2026-09-21 to go through the deck.
- The deck has to be produced in Keynote for the event's very wide presentation format. David will check whether August can do it, otherwise he will do it on his own Mac.
- Nicolás spent approximately US$80 generating the race video content with Gemini/Veo.

## Action items

### Nicolás Levy

- **Update the demos as discussed** — deadline: Not specified — priority: High
  - _Evidence:_ "so let's continue in chat I will update the demos as we talked uh blah blah blah and uh should share with you"
  - _How/steps:_ swap the assets of the side-by-side comparison demo for the polished generated content; add an ad break to the racing multi-view demo with an overlay, a regular interstitial and a concurrent double-box; replace the placeholder and third-party ad content with advertisement-looking creative.
- **Surface the decoder-count control in the web demo** — deadline: Not specified — priority: Medium
  - _Evidence:_ "Uh I think it's already implemented. It's not in the demo itself. So I can just uh I will I'm taking notes on this and and just make it work."
  - _How/steps:_ a UI control for the number of supported decoders, passed on the asset list call, with the asset list responding with a layout appropriate to that number. David's preference is to show it on the side-by-side demo, where the fallback to the other side's experience is visible.
- **Write the first pass of the updated SVTA specification document** — deadline: first draft this week (week of 2026-09-21) — priority: High
  - _Evidence:_ "I have time. I have time to do it. […] And I want to do it because I think I want to make it AI stuffy."
  - _How/steps:_ merge the separate documents into a single spec; carry in the material produced since the last version; AI-assisted, from the requirements document and context; David then reviews, either against a redline or by diffing.
- **Take the open dismissal question to the next working group call [?]** — deadline: Not specified — priority: Low
  - _Evidence:_ "this is a thing that maybe we can go through on the next working […] group call or something."
  - _Note:_ the substantive question was answered in this meeting (break-level skip). What Nicolás flagged for the working group is the remaining open state of the requirement.

### David Hassoun

- **Go through the deck with Apple** — deadline: 2026-09-21 — priority: High
  - _Evidence:_ "I mean supposedly with Apple today to go through the deck."
- **Rework the deck** — deadline: this week — priority: High
  - _Evidence:_ "I'm going to focus this week on I got to get this deck done"
  - _How/steps:_ turn the step-by-step section into a single flow, highlight the key points, and go deeper on detection; then produce the Keynote version for the wide-screen format, with August if she is available.
- **Review the SVTA spec draft once it exists** — deadline: Not specified — priority: High
  - _Evidence:_ "and then I can start doing review and all that other stuff on it as well."

### Emil Santurio

- **Build and set up the iOS app for David's iPad, via TestFlight** — deadline: before 2026-10-07 — priority: Low (explicitly off the critical path)
  - _Evidence:_ David asked directly — "if you have, you know, later version and can help get that rolling and want to set that up, um, that would be amazing." and "if you can do that, that's not on critical path". Emil's only responses on this thread were "Mhm." and, to the separate question of whether his machine can run a newer version, "Yes." **Emil did not verbally accept the TestFlight packaging itself in the meeting**; the request is recorded here as assigned but unconfirmed.
- **Produce advertisement creative for the demos** — deadline: Not specified — priority: Medium
  - _Evidence:_ reported by David, not stated by Emil — "And I guess Emil was said she was working on hopefully making something." [sic] Not confirmed by Emil in this meeting.

### Unassigned

- **Script the demo: decide what is actually shown, in what order, and in what words** — deadline: Not specified — priority: High
  - _Evidence:_ "That's why I need we need to start fig[ur]ing out like what do we actually show and script this out." No one took this on in the meeting.
- **Grant Nicolás and Emil access to the SVTA spec document** — deadline: Not specified — priority: High
  - _Evidence:_ "Gosh, I just asked for access." — Nicolás; "Yeah, me too." — Emil. The access request was raised but no one stated they would grant it.

## Parking lot

- Taking the work further with MTV and into the Qualabs accelerator and ad-solutions offering, once the Apple event is wrapped up. David raised it as his plan, with no dates.
- Whether the ad presentation server should adapt the layout dynamically to the reported decoder count, rather than the demo switching which surface it calls. David described the dynamic version as the ideal but said it is not needed for the demo.

## Additional context

- The SVTA spec document link was shared in the meeting chat and is not reproduced here.
- The demos were pointed at on a shared screen ("this one", "the other one"), so which specific demo is meant by "the simpler single-player demo shown with the network tab" cannot be established from the transcript alone and should be confirmed before the script is written. What is unambiguous is which demo is the main one (the side-by-side comparison), which one closes (the racing multi-view), and which one is dropped (the one combining an ad and multi-view in a single page).
- Names marked `[?]` are uncertain in the transcript: the working group David and Nicolás referred to, the person "Olivia" David mentioned as a possible alternative for the spec update, and the "L-bar" term in the decoder-count discussion.
