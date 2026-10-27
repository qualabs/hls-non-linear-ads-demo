# SVTA2053: DASH Carriage of Concurrent Presentation

This file holds the changes that the DASH carriage of concurrent presentation makes to SVTA2053
v3, written as the next edition would carry them. Each block names the section of SVTA2053 v3 it
replaces or adds; quoted text is the text being replaced. Section, table and code numbers are
those of the v3 text, and the numbers this file adds follow on from them. The notes at the end are
for the editor and are not spec text.

---

## Abstract

Replace the last sentence:

> This edition extends the scheme to concurrent (non-linear) presentations, in which ad or
> editorial assets are rendered together with the primary content instead of replacing it, and
> defines their carriage in HLS through a dedicated EXT-X-DATERANGE class and the ASSET-LIST object.

with:

This edition extends the scheme to concurrent (non-linear) presentations, in which ad or editorial
assets are rendered together with the primary content instead of replacing it, and defines their
carriage in HLS, through a dedicated EXT-X-DATERANGE class and the ASSET-LIST object, and in DASH,
through the EventStream carriage of the scheme.

## Versioning

In the row of Version 3.0, replace "and HLS carriage through the concurrent interstitial class" with
"HLS carriage through the concurrent interstitial class, and DASH carriage through the EventStream".

## Table of Contents

Add "6.7 DASH Concurrent Presentation with EventStream Carriage". Replace "7 HLS Reference
Implementation (Informative)" with "7 Reference Implementations (Informative)", with "7.1 HLS" and
"7.2 DASH".

## 1 Objectives and Scope

In the scope this document ADDRESSES, replace:

> Ordered presentation options for a slot, the device capability parameters a Player sends when
> requesting an ASSET-LIST, and how a Player selects the option it presents.

with:

- Ordered presentation options for a slot, the device capability parameters a Player sends when
  requesting an ASSET-LIST or the slots of a Pod, and how a Player selects the option it presents.

and add after the last item:

- Carriage of concurrent presentations in a DASH EventStream, and the processing a Player applies
  to the slots it references, including fallback.

In the scope this document DOES NOT ADDRESS, remove:

> Concurrent presentation in DASH. The layout data model of Section 4 is format independent; its
> DASH carriage is left to a future edition.

## 2 Introduction

Replace "it defines how an HLS Player discovers such presentations" with "it defines how an HLS or
DASH Player discovers such presentations".

## 3 Acronyms and Definitions

Replace the description of APS with: "Ad Presentation Server, the system that answers the Player's
request for the ASSET-LIST (6.6) or for the slots of a Pod (6.7.4), converting the decision of the
ADS into the object it returns, including its layout data."

## 4.1 Data Model Overview

Replace:

> The exception is a concurrent presentation, whose additional assets are referenced by the layout
> of its options (4.4.8, 4.4.9), because they are not part of the stitched timeline.

with:

The exception is a concurrent presentation, because its media is not part of the stitched
timeline: its additional assets are referenced by the layout of its layoutOptions (4.4.8, 4.4.9),
and in the DASH carriage of 6.7 its linear default is referenced by the media of its Slot (4.4.3,
6.7.5).

## 5.2.2.1 Base Envelope

Add to Table 18, after features.remoteFields:

| Data Payload Key | Value |
| --- | --- |
| features.concurrentPresentation | A boolean value that MUST be set to true if the data payload is a concurrent presentation carried as defined in 6.7. |

## 5.2.2.2.2 Remote Resolution Semantics

Add after the first paragraph:

Note: In the carriage of 6.7, the slots of a concurrent Pod MAY be resolved through $remote.slots,
and the slots that resolution returns are the decision of the break. This does not contradict the
paragraph above: a concurrent presentation is rendered over the primary content, which keeps
playing, so the primary content and its timeline are the same whatever slots are returned, and how
the stream has been decisioned or stitched does not change.

## 5.3.1 Layout Semantics

Replace the first sentence of the Window item:

> A presentation starts at its scheduled time (6.6.2) and ends as an HLS interstitial does
> ([RFC8216bis] Appendix D.2): when playback reaches the end of its assets or, if the range carries
> X-PLAYOUT-LIMIT, when playback reaches that offset from the start of the range.

with:

In HLS, a presentation starts at its scheduled time (6.6.2) and ends as an HLS interstitial does
([RFC8216bis] Appendix D.2): when playback reaches the end of its assets or, if the range carries
X-PLAYOUT-LIMIT, when playback reaches that offset from the start of the range. In DASH, a
presentation starts and ends as defined in 6.7.3.

The rest of the item, which refers to the DURATION of an Asset-Description, applies to HLS.

## 5.3.3 Presentation Options and Device Capabilities

- **Capability parameters.** Add: "In DASH, a Player MAY send the same parameters, with the same
  values, on the request for the slots of a Pod through $remote.slots (6.7.4). The APS that answers
  that request is the APS of this section."
- **Asset load failure.** Replace "(in HLS, its Multivariant Playlist or Media Playlist)" with "(in
  HLS, its Multivariant Playlist or Media Playlist; in DASH, its MPD)".
- **When no option fits.** After "the Player applies the fallback of 6.6.4", add "in HLS, or of
  6.7.5 in DASH".

---

## 6.7 DASH Concurrent Presentation with EventStream Carriage

A concurrent presentation in DASH is signaled with an Event of the scheme of 6.1, whose body is a
version 2 carriage envelope of type "pod" marked with features.concurrentPresentation. Its slots
carry the layout data of Section 5.3, inside the Event or behind $remote.slots, which plays the
role of the ASSET-LIST of 6.6. A Player opts into the presentation by implementing this subsection.
Nothing else in the MPD changes.

### 6.7.1 EventStream and Event

Tables 24 and 25 apply, with the following constraints.

- Each break is one Event, as each break is one EXT-X-DATERANGE in 6.6.1.
- The Events of this subsection share the EventStream of 6.1 in their Period. ISO/IEC 23009-1
  allows at most one EventStream with the same @schemeIdUri and @value in a Period (5.10.2.1), and
  @value is omitted (Table 24).
- @id is an unsigned integer, the type ISO/IEC 23009-1 gives it in its XML syntax (5.10.2.3).
- @duration MUST be present.
- The body is the envelope of 6.7.2, as a string, in the content of the Event (Table 25).
  @messageData MUST NOT be used: it is deprecated as of the 6th edition of ISO/IEC 23009-1 and
  prohibited in its XML syntax (Table 44, 5.10.2.3).

A Player SHOULD process these Events on receive (ISO/IEC 23009-1, A.13.7), because it requests the
slots ahead of the start of the presentation (6.7.4).

```xml
<Period id="1" start="PT0S">
<EventStream
schemeIdUri="urn:svta:advertising-wg:ad-creative-signaling"
timescale="1000">
<Event
id="2"
presentationTime="150000"
duration="24000"><![CDATA[{"version":2,"type":"pod","features":{"remoteFields":true,"concurrentPresentation":true},"cue":["ONCE"],"payload":[{"duration":24,"$remote":{"slots":"https://aps.example.com/session/c9563840-af14-4e40-b178-b72fd48af704/pod/2/slots"}}]}]]></Event>
...
</EventStream>
...
</Period>
```

Code 15: DASH Concurrent Presentation Event

### 6.7.2 Payload

The body of the Event is a version 2 carriage envelope (5.2.2.1) where:

- type is "pod", and payload contains exactly one Pod (5.2.1.4);
- features.concurrentPresentation is true (Table 18);
- the Pod carries its slots in slots, or a URI in $remote.slots (Table 19) that resolves to an
  envelope of type "slot", in which case features.remoteFields is true;
- each concurrent Slot carries its layoutOptions (5.3.3), and MAY carry media (4.4.3), whose first
  MediaReference with a uri is the linear default of the Slot (6.7.5). It SHOULD be an MPD, of type
  "application/dash+xml";
- Pod.start SHOULD be omitted; when present, the Event governs (6.7.3).

A media asset of a layout (4.4.8) is an MPD, of type "application/dash+xml", or a progressive file.

A Pod MAY mix concurrent and linear slots: a Slot without layoutOptions is presented through its
media as a linear ad.

The envelope MAY carry the following key, next to version, type and payload:

| Key | Value | Required | Description |
| --- | --- | --- | --- |
| cue | An array of one or more of "PRE", "POST", "ONCE" | No | When the Pod is presented relative to playback (6.7.6). It MUST NOT contain both "PRE" and "POST". |

Table 31: DASH Concurrent Presentation Envelope Keys

```json
{
"version": 2,
"type": "slot",
"payload": [
{
"start": 0,
"duration": 12,
"identifiers": [{
"scheme": "urn:smpte:ul:060E2B34.01040101.01200900.00000000",
"value": "ABCD1234567H"
}],
"media": [{
"type": "application/dash+xml",
"id": "abcd1234567h-16x9",
"uri": "https://cdn.example.com/ads/abcd1234567h/16x9/manifest.mpd"
}],
"layoutOptions": [
{
"type": "squeezebackLShape",
"layout": {
"primaryContent": { "zDepth": 1, "viewport": "0 0 25 25" },
"assets": [{
"id": "lBackplate",
"type": "application/dash+xml",
"uri": "https://cdn.example.com/ads/abcd1234567h/backplate/manifest.mpd",
"viewport": "0 0 0 0",
"zDepth": 0
}]
}
},
{
"type": "squeezebackDoubleBox",
"layout": {
"primaryContent": { "zDepth": 0, "viewport": "25 50 25 0" },
"assets": [{
"id": "adSideBySide",
"type": "image/png",
"uri": "https://cdn.example.com/ads/abcd1234567h/side-by-side.png",
"viewport": "25 0 25 50",
"zDepth": 1
}]
}
}
]
},
{
"start": 12,
"duration": 12,
"identifiers": [{
"scheme": "urn:smpte:ul:060E2B34.01040101.01200900.00000000",
"value": "ABCD9876543H"
}],
"layoutOptions": [{
"type": "lowerThirdOverlay",
"layout": {
"assets": [{
"id": "adOverlay1",
"type": "image/png",
"uri": "https://cdn.example.com/ads/abcd9876543h/lower-third.png",
"viewport": "70 0 0 0",
"zDepth": 1
}]
}
}]
}
]
}
```

Code 16: Slot Envelope Returned for $remote.slots

The first slot of Code 16 has a linear default; the second has none, and is skipped when its option
cannot be presented (6.7.5).

### 6.7.3 Timing

The window of the Pod is the active interval of its Event: it starts at the start of the Period
plus (@presentationTime − EventStream@presentationTimeOffset) / EventStream@timescale (Tables 24
and 25), and lasts @duration / EventStream@timescale. Pod.duration SHOULD equal it. The window ends
at the end of the Period at the latest (ISO/IEC 23009-1, 5.10.2.1).

Each Slot is presented from the start of the window plus Slot.start, for Slot.duration. The slots
of a Pod MUST be one behind the other: the first starts at 0, and each one starts where the one
before it ends. A Player SHOULD NOT present a Pod whose slots leave a gap or overlap.

A presentation ends Slot.duration after it starts, or at the end of the window, whichever comes
first. An element of its layout does not extend it.

In Code 15, with the Period at 0, the window is 150 s to 174 s of the Period, and the slots of
Code 16 are presented from 150 s to 162 s and from 162 s to 174 s.

### 6.7.4 Remote Resolution and Capability Parameters

The slots behind $remote.slots are resolved as 5.2.2.2.2 defines, delaying the request until the
Pod is about to become active. A Player SHOULD request them when the playhead is 60 seconds or less
before the start of the window, or when playback enters the window, for example by a seek, and not
earlier. The 60 seconds are the default of @earliestResolutionTimeOffset in ISO/IEC 23009-1
(Table 63), which bounds the same request for an Alternative MPD event. The slots of a Pod whose
cue contains "PRE" are requested when the MPD is loaded, and those of a Pod whose cue contains
"POST" when the primary content has been buffered to its end.

The Player MAY append the capability parameters of 5.3.3 to the request.

```
GET /session/c9563840-af14-4e40-b178-b72fd48af704/pod/2/slots?sgai-video-decoders=2&sgai-image-over-video=1
Host: aps.example.com
```

A relative URI in the body of the Event is resolved against the URL of the MPD. A relative URI in
the envelope returned for $remote.slots is resolved against the URL of that envelope.

If the request fails, or what it returns is not a version 2 envelope of type "slot", the Pod is not
presented and the primary content continues. If the envelope has no slots, nothing is presented.

### 6.7.5 Fallback

The Player decides according to the capabilities of the device, and each Slot of the Pod resolves
in one of three ways.

| The slot | The Player |
| --- | --- |
| carries layoutOptions, and an option, after option selection (5.3.3), can be presented | presents it concurrently, with its layout |
| carries no layoutOptions, or none that can be presented, and has media with a uri | presents its media full frame, for the window of the slot, while the primary content keeps playing underneath: the linear default of the slot |
| has neither | skips the slot, and the primary content continues |

Table 32: Resolution of a Slot of a DASH Concurrent Presentation

If the first request for the media of a linear default fails, the slot is skipped, as in the last row
of Table 32. A skipped slot keeps its window, because slots are placed by their start (6.7.3):
skipTiming (Table 29) does not apply to this carriage.

### 6.7.6 Pre-roll, Post-roll and Once

The cue key of the envelope (Table 31) has the values of the CUE attribute of HLS.

- **PRE.** The Pod is presented over the primary content from the point where playback starts, for
  the duration of its window, whatever its @presentationTime.
- **POST.** The Pod is presented after the primary content ends. There is no primary content to
  present it over, so its layoutOptions are not used: each slot that has media is presented full
  frame, as its linear default, in order, and the others are skipped. Its @presentationTime is not
  used.
- **ONCE.** The Pod is presented only the first time playback traverses its window. Once playback
  has entered the window and left it, the Pod is not presented again, whether or not its slots were
  presented.

ISO/IEC 23009-1 has a similar name, @executeOnce (Table 63), for Alternative MPD events only, with
other counting semantics: it counts executions of the event, and an execution that fails is not
counted (5.16.2.2). Neither replaces the other.

### 6.7.7 Coexistence with Alternative MPD Events

The window of a Pod of this subsection SHOULD NOT overlap the active interval of an Alternative MPD
event (ISO/IEC 23009-1, 5.16.3, 5.16.4). If they overlap, the Alternative MPD event takes priority:
while the alternative presentation plays, the Player presents nothing of this subsection and counts
nothing for it. With a replacement event the main presentation is not output and its media time
keeps progressing (5.16.1), so the window of a slot keeps elapsing; if it is still open when the
main presentation resumes, the Player presents the rest of it.

### 6.7.8 Clients That Do Not Implement Concurrent Presentation

A client that reads the scheme as defined in 6.1 and conforms to 5.2.2.1 finds
features.concurrentPresentation set to true, a flag it does not support, raises an error, and
ignores the payload. It presents nothing for the break, not even the linear default, and counts
nothing for it.

A client that does not honor the flags reads a Pod whose slots it never presented. If it fires
their tracking, it reports impressions of ads it never drew. This carriage cannot prevent that.

---

## 7 Reference Implementations (Informative)

Rename "7 HLS Reference Implementation (Informative)" to "7 Reference Implementations
(Informative)".

### 7.1 HLS

The current text of §7, unchanged, with its Table 31 renumbered Table 33.

### 7.2 DASH

A reference implementation of Sections 5.3 and 6.7 exists for dash.js, developed by Qualabs for the
SVTA, as a library that runs over an unmodified dash.js 5.2.1. It shares with the implementation of
7.1 everything but the reading of the MPD and the loading of DASH media, and it reads only an MPD
of type "static". It has to be attached to the dash.js MediaPlayer before the MPD is loaded: it
reads the EventStream from the text of the MPD, as dash.js receives it, and not from the events
dash.js dispatches, because dash.js 5.2.1 does not deliver an Event body written in CDATA nor the
attributes of a ReplacePresentation.

| Feature | Section | dash.js |
| --- | --- | --- |
| EventStream and Event | 6.7.1 | Implemented. @id is read as a string |
| Pod envelope, flag, slots inside or in $remote.slots | 6.7.2, 5.2.2.1 | Implemented. Only the first Pod of the payload is read. An envelope without features.concurrentPresentation, or with a flag the library does not implement, is ignored |
| Slot.media as the linear default | 6.7.2, 6.7.5 | Implemented: the first MediaReference with a uri |
| Window, slots one behind the other, end of the Period | 6.7.3 | Implemented. A Pod whose slots leave a gap or overlap is not presented. A Period starts at its @start or at the end of the Period before it |
| Request 60 s before the window, or on entering it | 6.7.4 | Implemented. A pre-roll's at load, a post-roll's when the primary content is buffered to its end |
| Capability parameters on $remote.slots | 5.3.3, 6.7.4 | Implemented, with the same code as 7.1. The same parameters as the ASSET-LIST request of 7.1 on the same stream, measured in the four combinations of the two capabilities |
| Relative URIs | 6.7.4 | Partly. A relative $remote.slots is resolved against the URL of the MPD. A relative URI inside the returned envelope is not resolved against the envelope's URL: it is handed to the media element as written |
| Option selection, asset load failure, linear default, skip | 5.3.3, 6.7.5 | Implemented. The first request of an MPD asset fails when dash.js reports an error before the MPD is loaded (a 404 on the MPD: error 25, after 1.6 s); a 404 on its initialization or first media segment arrives after the MPD is loaded and is a playback error. On the same stream the same option as 7.1 is presented in every break and combination of capabilities; with the MPD of the first option answered 404, the next option is presented |
| PRE, POST and ONCE | 6.7.6 | Implemented. A ONCE break entered, left and sought back into is not presented again, as in 7.1 |
| Alternative MPD events | 6.7.7 | dash.js 5.2.1 does not execute them. The library executes a replacement event (5.16.4) itself: the MPD of its @uri full frame, for @duration or @maxDuration, whichever is shorter, with nothing of 6.7 presented meanwhile. @executeOnce is read as cue "ONCE" (6.7.6), not with the counting of 5.16.2.2. @returnOffset, @clip, @startWithOffset, @earliestResolutionTimeOffset and @noJump are not read. Insertion events (5.16.3) are not implemented |
| Same option presented at the same second of the primary content as 7.1, in every break | 6.7 | Yes, measured on one stream carried both ways: the same option and the same window in the pre-roll, three mid-roll breaks, the replacement break and the post-roll |
| Tracking, verification, skipOffset and clickThrough | 4.4 | As in 7.1: the same code |
| multiView, and MPD of type "dynamic" | 5.3.4 | Not implemented |

Table 34: Reference Implementation Status, DASH

## 9 Specifications and Standard References

Replace the row "ISO/IEC 23009-1:2022, MPEG-DASH 5th Edition" with "ISO/IEC 23009-1:2026, MPEG-DASH
6th Edition", which defines the Alternative MPD events and Table 63 cited in 6.7. The table is
renumbered Table 35.

## 10 Tables and Figures

In 10.1, after Table 30:

- Table 31: DASH Concurrent Presentation Envelope Keys
- Table 32: Resolution of a Slot of a DASH Concurrent Presentation
- Table 33: Reference Implementation Status, HLS (formerly Table 31)
- Table 34: Reference Implementation Status, DASH
- Table 35: Specification and Standard References (formerly Table 32)

In 10.2, after Code 14:

- Code 15: DASH Concurrent Presentation Event
- Code 16: Slot Envelope Returned for $remote.slots

---

## Notes for the editor

Not spec text.

**(a) Serving clients of both kinds in DASH.** In HLS one playlist serves both kinds of client:
each loads it with its class in a query parameter (?adclass=), and EXT-X-DEFINE:QUERYPARAM
substitutes it into the CLASS of each break. An MPD has no substitution of variables in its
attributes, so the DASH equivalent is server side: the publisher serves one MPD per kind of client,
and the origin or the APS picks it by the query of the MPD request. Signaling the break twice in the
same MPD, once as 6.7 and once as an Alternative MPD event, would make a Player that implements both
execute it twice. The recommendation is that 6.7 say this, as the counterpart of ?adclass= in 6.6.

**(b) The scheme URI in the examples.** §5 and Table 24 give
"urn:svta:advertising-wg:ad-creative-signaling"; Code 8, Code 9 and Code 13 use
"urn:svta:advertising-wg:ad-id-signaling". Code 15 uses the one of §5. The examples should be
corrected.

**(c) dash.js and CDATA.** dash.js 5.2.1 does not deliver to the application an Event body written
in CDATA: messageData arrives undefined, because its model reads `__cdata` and its parser leaves
the section in `#cdata`. A body written as plain text arrives. Every example of 6.1 uses CDATA, so
a 6.1 application over dash.js 5.2.1 receives no payload. It is a defect of dash.js, not of the
carriage.

**(d) layoutOptions.** This text uses layoutOptions and LayoutOption, the names of the current
edition. The v3 draft of 2026-10-02, against which the numbers here were checked, still says
options and SlotOption.
