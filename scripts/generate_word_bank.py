#!/usr/bin/env python3
"""Generate the shared 2,000-entry game vocabulary.

The generated JSON is committed so the games do not need network access.
Run this script only when intentionally refreshing the source datasets.
"""

from __future__ import annotations

import csv
import html
import io
import json
import os
import re
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "satsangWordBank.json"
TARGET_COUNT = 2000

HINDU_NAMES_URL = (
    "https://huggingface.co/datasets/aryansai/Hindu-Gods-DB/"
    "resolve/main/Hindu-Gods-DB.csv"
)
VISHNU_NAMES_URL = (
    "https://raw.githubusercontent.com/sahasranama/"
    "sahasranama.github.io/main/data/names_1000.json"
)
SHIVA_NAMES_URL = "https://99pandit.com/blog/1008-names-of-lord-shiva-complete-list/"

# Familiar terms are deliberately first so they are never displaced by the
# larger name collections. Format: display|clue|category.
CURATED = """
Aarti|Worship ceremony performed with lighted lamps|worship
Acharya|A spiritual teacher or guide|satsang
Adharma|Conduct contrary to righteousness|philosophy
Agna|A spiritual command or instruction|satsang
Ahimsa|The principle of non-violence|philosophy
Akshar|The eternal abode and ideal devotee of Purushottam|swaminarayan
Aksharbrahman|The eternal reality above maya that serves Purushottam|swaminarayan
Akshardham|The divine abode of Bhagwan Swaminarayan|swaminarayan
Amrut|Nectar or that which is immortal|satsang
Anand|Spiritual bliss or joy|philosophy
Anuvrutti|Following the inner wish of the guru|satsang
Arti|A shorter spelling of the lamp worship ceremony|worship
Ashram|A place for spiritual practice and community|community
Ashtang Yoga|The eight-limbed path of yoga|philosophy
Atma|The eternal self or soul|philosophy
Atmabuddhi|Deep identification and oneness with the Satpurush|swaminarayan
Atmajnan|Knowledge of the true self|philosophy
Atmanivedan|Complete offering of oneself to God|worship
Atmarup|Established in awareness of oneself as atma|swaminarayan
Avatar|A divine manifestation on earth|hinduism
Ayodhya|Sacred birthplace of Bhagwan Ram|place
Bal Mandal|A satsang group for children|community
Balak|A child|community
Bapa|An affectionate form of address for a revered guru|swaminarayan
Bhagavad Gita|Krishna's sacred teaching to Arjuna|scripture
Bhagwan|The supreme Lord|hinduism
Bhajan|A devotional song or act of worship|worship
Bhakta|A devotee of God|devotion
Bhakti|Loving devotion to God|devotion
Brahma|The deity associated with creation|deity
Brahmacharya|Self-restraint and purity|philosophy
Brahmabhav|Awareness of one's spiritual identity with Akshar|swaminarayan
Brahmajnan|Knowledge of Brahman|philosophy
Brahman|The eternal spiritual reality|philosophy
Brahmarup|Having become like Brahman|swaminarayan
Brahmavidya|Knowledge of Brahman and Parabrahman|philosophy
Chandan|Sandalwood paste used in worship|worship
Chandlo|The round red mark worn on the forehead|swaminarayan
Chaturmas|Four holy monsoon months of added observance|festival
Chesta|Verses describing Bhagwan Swaminarayan's divine form|swaminarayan
Darshan|Reverent sight of God, a murti, or a holy person|worship
Dasbhav|The humble attitude of being God's servant|devotion
Daya|Compassion|value
Deh|The physical body|philosophy
Dehbhav|Identification of the self with the body|philosophy
Deepavali|The festival of lights|festival
Deva|A deity or divine being|deity
Devotee|One who is devoted to God|devotion
Dharma|Righteous conduct and sacred duty|philosophy
Dharmic|In accordance with dharma|philosophy
Dhun|Repetitive chanting of God's name|worship
Dhyan|Meditation and focused remembrance|worship
Diksha|Formal spiritual initiation|satsang
Divyabhav|Seeing the divine qualities of God and the Satpurush|swaminarayan
Diwali|The Hindu festival of lights|festival
Ekadashi|A sacred fasting day on the eleventh lunar day|festival
Ekantik Dharma|Dharma, jnan, vairagya and bhakti together|swaminarayan
Gadhada|Town where many Vachanamrut discourses were delivered|place
Ganesh|The elephant-headed remover of obstacles|deity
Ganga|India's sacred river|place
Ghar Sabha|A regular spiritual assembly held at home|community
Ghee|Clarified butter used in food and rituals|worship
Gita|Sacred dialogue between Krishna and Arjuna|scripture
Gnan|Spiritual knowledge|philosophy
Goloka|The divine abode associated with Krishna|place
Gopi|A devotee remembered for pure love of Krishna|devotion
Govardhan|The sacred hill lifted by Krishna|place
Guru|A spiritual teacher who dispels ignorance|satsang
Guru Bhakti|Devotion to the spiritual guru|swaminarayan
Guru Purnima|Festival honouring the spiritual teacher|festival
Gurukul|A traditional place of learning with a guru|community
Gunatit|Beyond the three gunas|swaminarayan
Gunatitanand|The first spiritual successor of Bhagwan Swaminarayan|swaminarayan
Gunas|The three qualities of sattva, rajas and tamas|philosophy
Hanuman|Ram's devoted servant, known for strength and bhakti|deity
Havan|A sacred fire ceremony|worship
Holi|Spring festival of colour|festival
Jagannath|A celebrated form of Krishna|deity
Jai|An exclamation of victory or praise|worship
Janmashtami|Festival celebrating Krishna's birth|festival
Japa|Repetition of a divine name or mantra|worship
Jiva|An individual eternal soul|philosophy
Jnan|Knowledge of the self and God|philosophy
Kaliyug|The fourth and present age in the cycle of yugas|philosophy
Karma|Action and its moral consequence|philosophy
Katha|A spiritual discourse on scripture|satsang
Kirtan|A devotional hymn or song|worship
Kishore|A teenager or youth|community
Krishna|The divine teacher of the Bhagavad Gita|deity
Krupa|Grace|value
Lakshmi|Goddess associated with prosperity|deity
Lila|A divine act or sacred episode|hinduism
Mahabharata|Epic containing the Bhagavad Gita|scripture
Mahadev|A revered name of Shiva meaning great God|deity
Mahant|A senior sadhu or spiritual leader|satsang
Mahima|Understanding divine glory and greatness|devotion
Mahapuja|An extended communal form of worship|worship
Mala|Rosary beads used for mantra repetition|worship
Mandal|A local satsang group or centre|community
Mandir|A Hindu temple|worship
Mantra|Sacred words repeated in prayer or meditation|worship
Maya|That which causes attachment and spiritual ignorance|philosophy
Moksha|Liberation from rebirth and maya|philosophy
Murti|A sacred image or embodied form of a deity|worship
Narayan|A name of the supreme Lord|deity
Narnarayan|The divine pair worshipped at Ahmedabad|swaminarayan
Nirakar|Without a material form|philosophy
Nirgun|Beyond material qualities|philosophy
Nirvikalp|A state of unwavering conviction and absorption|swaminarayan
Nischay|Firm conviction in God|devotion
Nitya Puja|Daily personal worship|worship
Niyam|A spiritual rule or daily observance|satsang
Paramatma|The supreme self or God|philosophy
Parabrahman|The supreme God, Purushottam|swaminarayan
Paramhansa|A sadhu of the highest renounced order|swaminarayan
Parikrama|Walking reverently around a sacred object or shrine|worship
Parshad|An initiated renunciant dressed in white|swaminarayan
Pradakshina|Clockwise circumambulation during worship|worship
Pragat|Manifest and present|swaminarayan
Pramukh|One who leads or presides|swaminarayan
Prarthana|A heartfelt prayer|worship
Prasad|Food sanctified by offering it to God|worship
Prasadi|Something sanctified through association with God|swaminarayan
Prem|Selfless spiritual love|value
Puja|Ritual and personal worship|worship
Punya|Spiritual merit from righteous action|philosophy
Purushottam|The supreme person, beyond all other realities|swaminarayan
Ram|The righteous king and avatar celebrated in the Ramayana|deity
Ramayana|Epic recounting the life of Bhagwan Ram|scripture
Rangoli|Decorative floor art made for auspicious occasions|festival
Rishi|An inspired sage or seer|satsang
Sabha|A spiritual assembly|community
Sadachar|Moral and disciplined conduct|value
Sadhak|An aspirant following a spiritual path|satsang
Sadhana|Disciplined spiritual practice|satsang
Sadhu|A holy renunciant|satsang
Sadhvi|A female renunciant|satsang
Sahasranam|A litany of one thousand divine names|scripture
Samadhi|A state of deep spiritual absorption|philosophy
Samagam|Spiritual association with saints and devotees|satsang
Sampraday|A religious tradition or fellowship|community
Samsara|The cycle of worldly birth and death|philosophy
Sanskrit|Classical language of many Hindu scriptures|scripture
Sant|A saint or holy person|satsang
Sanstha|An organised religious fellowship|community
Saraswati|Goddess associated with learning and the arts|deity
Satpurush|The God-realised saint who guides seekers|swaminarayan
Satsang|Holy fellowship and association with truth|swaminarayan
Satsangi|A member of the satsang fellowship|community
Satya|Truth|value
Seva|Selfless voluntary service|devotion
Sevak|One who serves|devotion
Shangar|Adornment of a murti|worship
Shanti|Peace|value
Shastra|A sacred or authoritative scripture|scripture
Shikshapatri|Bhagwan Swaminarayan's code of conduct|swaminarayan
Shiva|The deity associated with transformation|deity
Shlok|A verse from a Sanskrit scripture|scripture
Shraddha|Faith and reverence|devotion
Shreeji Maharaj|A loving name for Bhagwan Swaminarayan|swaminarayan
Shruti|Revealed Hindu scripture|scripture
Smruti|Remembered sacred tradition and scripture|scripture
Swabhav|One's ingrained nature or habit|philosophy
Swadharma|Living according to one's righteous duty|philosophy
Swami|A title for a spiritual master or renunciant|satsang
Swaminarayan|Bhagwan Swaminarayan and his sacred mantra|swaminarayan
Swarup|Divine form or essential nature|philosophy
Tapa|Religious austerity|satsang
Tej|Divine radiance|philosophy
Thaad|A devotional offering arranged before a murti|worship
Thaal|A devotional song sung while offering food|worship
Tilak|The U-shaped sacred mark worn on the forehead|swaminarayan
Tilak Chandlo|The forehead marks worn by Swaminarayan devotees|swaminarayan
Tirth|A sacred pilgrimage place|place
Tulsi|Holy basil revered in Hindu worship|worship
Upanishad|A philosophical scripture of the Vedas|scripture
Upasana|The doctrine and practice of worship|swaminarayan
Utsav|A sacred celebration or festival|festival
Vachanamrut|Principal collection of Bhagwan Swaminarayan's discourses|swaminarayan
Vairagya|Detachment from worldly pleasures|philosophy
Vartal|A principal Swaminarayan pilgrimage town|place
Vato|Spiritual talks or discourses|swaminarayan
Veda|Ancient revealed Hindu scripture|scripture
Vedanta|Philosophical teaching based on the Upanishads|philosophy
Vishnu|The all-pervading preserver|deity
Vivek|Spiritual discrimination between right and wrong|value
Vrat|A religious vow or fast|worship
Yagna|A sacred offering or sacrifice|worship
Yamuna|Sacred river associated with Krishna|place
Yoga|A disciplined path toward spiritual union|philosophy
Yogi|One who practises yoga and spiritual discipline|satsang
Yogiji Maharaj|Fourth spiritual successor of Bhagwan Swaminarayan|swaminarayan
Abhishek|Ritual bathing of a sacred murti|worship
Advaita|The Vedantic school teaching non-duality|philosophy
Agni|The Vedic deity of fire|deity
Alakshmi|A figure representing misfortune|deity
Anjali|A gesture of reverence with joined palms|worship
Antaryami|God as the inner controller of all beings|philosophy
Arjuna|Warrior taught by Krishna in the Bhagavad Gita|scripture
Artha|Righteous material wellbeing, one of life's aims|philosophy
Ashirwad|A blessing|worship
Ashoka|A sacred tree and a name meaning without sorrow|hinduism
Asura|A powerful being often opposed to the devas|scripture
Ayurveda|Traditional Hindu system of health and wellbeing|philosophy
Badrinath|Himalayan pilgrimage shrine dedicated to Vishnu|place
Bhagavat|Relating to the blessed Lord|scripture
Bhasma|Sacred ash used in worship|worship
Bhog|Food prepared as an offering to God|worship
Bhumi|The earth, revered as a divine mother|deity
Chaitra|A month in the Hindu lunar calendar|festival
Chakra|A wheel or spiritual energy centre|hinduism
Charan|The feet, especially the revered feet of God or guru|devotion
Charanarvind|The lotus feet of God|devotion
Damaru|The small drum associated with Shiva|worship
Devaki|Mother of Krishna|scripture
Dhanteras|Festival day welcoming auspicious prosperity|festival
Dholak|A hand drum used in devotional music|worship
Durga|The powerful mother goddess|deity
Dussehra|Festival celebrating the victory of dharma|festival
Dwarka|Krishna's sacred coastal city|place
Garbhagruh|The innermost shrine of a mandir|worship
Garuda|The eagle-like vehicle of Vishnu|deity
Gayatri|A revered Vedic mantra and divine mother|worship
Ghanshyam|Childhood name of Bhagwan Swaminarayan|swaminarayan
Girnar|Sacred mountain in Gujarat|place
Gokul|Village associated with Krishna's childhood|place
Gopuram|Monumental gateway of a Hindu temple|worship
Govinda|A beloved name of Krishna|deity
Grihastha|The householder stage of life|philosophy
Indra|Vedic king of the devas|deity
Jagat|The world or created universe|philosophy
Jalaram|Gujarati saint renowned for service and hospitality|satsang
Jatayu|The noble bird who aided Ram in the Ramayana|scripture
Jayanti|A sacred birth anniversary celebration|festival
Kailash|Sacred mountain abode associated with Shiva|place
Kalash|A sacred water vessel used in rituals|worship
Kans|The tyrant defeated by Krishna|scripture
Kedarnath|Himalayan pilgrimage shrine dedicated to Shiva|place
Kumkum|Red powder used for auspicious forehead marks|worship
Kurukshetra|Field where the Bhagavad Gita was taught|place
Ladoo|A round Indian sweet commonly offered as prasad|food
Mahashivratri|Festival night devoted to Shiva|festival
Manas|The mind or faculty of thought|philosophy
Mathura|Sacred birthplace of Krishna|place
Modak|Sweet traditionally offered to Ganesh|food
Mridang|A double-headed drum used in devotional music|worship
Navratri|Nine-night festival honouring the divine mother|festival
Nilkanth|Youthful name of Bhagwan Swaminarayan during his travels|swaminarayan
Omkar|The sacred sound Om|worship
Panchamrut|Fivefold sacred mixture used in abhishek|worship
Pandava|One of the five righteous brothers in the Mahabharata|scripture
Pongal|Harvest festival celebrated in southern India|festival
Raksha Bandhan|Festival celebrating a protective bond|festival
Ramanavami|Festival celebrating the birth of Bhagwan Ram|festival
Rameshwaram|Southern pilgrimage place associated with Ram and Shiva|place
Rudra|A powerful Vedic name and form of Shiva|deity
Rudraksha|Sacred seed beads associated with Shiva|worship
Saffron|Colour associated with renunciation and holiness|satsang
Samprapti|Attainment or arrival|philosophy
Sankalp|A solemn spiritual resolve|worship
Saras|Graceful or full of essence|value
Sarovar|A sacred lake or reservoir|place
Shakti|Divine power, often personified as the goddess|philosophy
Shankh|A conch shell sounded during worship|worship
Shivling|Sacred symbol worshipped as Shiva|worship
Shrawan|A month of special devotion in the Hindu calendar|festival
Sita|Ram's devoted consort in the Ramayana|scripture
Somnath|Ancient jyotirlinga pilgrimage shrine in Gujarat|place
Sudarshan|Vishnu's divine discus|deity
Sugriva|Ally of Ram and king of the vanaras|scripture
Surya|The sun deity|deity
Sutra|A concise sacred teaching or aphorism|scripture
Swastik|Ancient auspicious Hindu symbol of wellbeing|worship
Tapasya|Spiritual austerity and disciplined effort|satsang
Torana|Decorative gateway or auspicious door hanging|festival
Tridev|The divine triad of Brahma, Vishnu and Shiva|deity
Trishul|The trident associated with Shiva|deity
Vaikunth|The divine abode associated with Vishnu|place
Vanaprastha|The forest-dweller stage of life|philosophy
Varanasi|Ancient sacred city on the Ganga|place
Vasant|The spring season|festival
Vedas|The four foundational revealed scriptures|scripture
Vrindavan|Sacred place of Krishna's childhood lilas|place
Vyas|Sage traditionally credited with compiling the Vedas|scripture
Yajurveda|Veda containing formulas for sacred rituals|scripture
Yashoda|Krishna's loving foster mother|scripture
Yatra|A sacred pilgrimage journey|worship
Yuga|A great age in the Hindu cycle of time|philosophy
""".strip()


def fetch_text(url: str, file_env: str = "") -> str:
    if file_env and os.environ.get(file_env):
        return Path(os.environ[file_env]).read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers={"User-Agent": "Bhaktiras word-bank generator"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8-sig")


def answer_for(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z]", "", ascii_value).upper()


def game_flags(answer: str) -> list[str]:
    games = []
    if len(answer) == 5:
        games.append("wordle")
    if 3 <= len(answer) <= 15:
        games.append("crossword")
    if len(answer) >= 4 and len(set(answer)) <= 7:
        games.append("spelling-bee")
    return games


def add_entry(
    rows: list[dict],
    seen: set[str],
    display: str,
    clue: str,
    category: str,
    source: str,
) -> None:
    answer = answer_for(display)
    clue = re.sub(r"\s+", " ", clue).strip().rstrip(".")
    if len(answer) < 3 or len(answer) > 24 or not clue:
        return
    if answer in seen:
        return
    seen.add(answer)
    rows.append(
        {
            "id": f"word-{len(rows) + 1:04d}",
            "answer": answer,
            "display": re.sub(r"\s+", " ", display).strip(),
            "clue": clue,
            "category": category,
            "source": source,
            "games": game_flags(answer),
        }
    )


def main() -> None:
    rows: list[dict] = []
    seen: set[str] = set()

    for line in CURATED.splitlines():
        display, clue, category = line.split("|", 2)
        add_entry(rows, seen, display, clue, category, "Bhaktiras curated")

    hindu_csv = csv.DictReader(io.StringIO(fetch_text(HINDU_NAMES_URL, "WORD_BANK_HINDU_NAMES_FILE")))
    for item in hindu_csv:
        deity = item.get("Deity", "").strip() or "a Hindu deity"
        name = item.get("Name", "").strip()
        meaning = item.get("Meaning", "").strip()
        clue = f"{meaning} — a sacred name associated with {deity}" if meaning else f"A sacred name associated with {deity}"
        add_entry(rows, seen, name, clue, f"{deity.lower()}-name", "Hindu Gods DB (CC BY 4.0)")

    shiva_text = fetch_text(SHIVA_NAMES_URL, "WORD_BANK_SHIVA_NAMES_FILE")
    shiva_start = shiva_text.find("Shiva – Pure")
    shiva_end = shiva_text.find("Sarvayoni – Source Of Everything", shiva_start)
    shiva_section = shiva_text[shiva_start:shiva_end + 100]
    shiva_items = re.findall(r"<li[^>]*>(.*?)</li>", shiva_section, flags=re.DOTALL)
    if not shiva_items:
        shiva_items = re.findall(r"^\d+\.\s+(.+)$", shiva_section, flags=re.MULTILINE)
    for item in shiva_items:
        text = html.unescape(re.sub(r"<[^>]+>", "", item))
        parts = re.split(r"\s+[–—-]\s+", text, maxsplit=1)
        name = parts[0].strip()
        if name:
            add_entry(rows, seen, name, "A sacred name of Shiva", "shiva-name", "Shiva Sahasranama")

    vishnu_names = json.loads(fetch_text(VISHNU_NAMES_URL, "WORD_BANK_VISHNU_NAMES_FILE"))
    for item in vishnu_names:
        add_entry(
            rows,
            seen,
            str(item.get("name", "")),
            str(item.get("meaning", "")) or "A sacred name of Vishnu",
            "vishnu-name",
            "Vishnu Sahasranama Atlas",
        )

    if len(rows) < TARGET_COUNT:
        raise RuntimeError(f"Only generated {len(rows)} entries; need {TARGET_COUNT}")

    rows = rows[:TARGET_COUNT]
    # Re-number after truncation so IDs remain a simple stable sequence.
    for index, row in enumerate(rows, 1):
        row["id"] = f"word-{index:04d}"

    OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    unique_answers = len({row["answer"] for row in rows})
    print(f"Wrote {len(rows)} entries ({unique_answers} unique answers) to {OUTPUT}")


if __name__ == "__main__":
    main()
