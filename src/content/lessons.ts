/**
 * The curriculum. Each physics lesson has a kid-facing one-liner (short,
 * concrete, sayable) and a Pit Crew Note — a script for a grown-up to read
 * aloud and discuss, one level deeper. See design.md §6.
 */
export type LessonId = 'carve' | 'weight' | 'placement' | 'friction' | 'aero' | 'wheels'

export interface Lesson {
  id: LessonId
  /** id into the SVG icon set (ui/icons.tsx LESSON_ICONS) */
  icon: 'saw' | 'scale' | 'weightBack' | 'sparkle' | 'wind' | 'lift'
  title: string
  kidLine: string
  /** concrete post-race tip template; {gain} = car lengths gained */
  tipLine: string
  parentScript: string
  tryAtHome: string
}

export const LESSONS: Record<LessonId, Lesson> = {
  carve: {
    id: 'carve',
    icon: 'saw',
    title: 'Carve it!',
    kidLine: 'A block is not a race car yet — carve it and make it yours!',
    tipLine: 'Carving your car sleeker would have helped — try the carve station!',
    parentScript:
      'Every fast derby car starts as the same block of pine. Carving does two jobs at once: it takes away wood the air would have to push past, and it makes room for weights that push the car down the hill. Ask: what shape do YOU think slips through air best?',
    tryAtHome: 'Hold your hand out the car window (gently!) — flat palm, then karate-chop. Feel the difference? That is aerodynamics.',
  },
  weight: {
    id: 'weight',
    icon: 'scale',
    title: 'Heavy is fast',
    kidLine: 'Heavy cars push harder down the hill — load it up to the 5 oz limit!',
    tipLine: 'Adding weight up to 5 oz would have won it by {gain}!',
    parentScript:
      'Gravity pulls the car down the ramp — that is the engine. A heavier car stores more of that pull (potential energy) at the top and keeps more speed at the bottom, because air drag steals a smaller share from a heavy car than a light one. Real derby rules allow exactly 5 ounces: champions add weight until the scale just barely says yes.',
    tryAtHome: 'Roll a marble and a heavy ball bearing down the same ramp into a fan’s breeze. Which one cares less about the wind?',
  },
  placement: {
    id: 'placement',
    icon: 'weightBack',
    title: 'Heavy in the BACK',
    kidLine: 'Put the weight in the back — it rides the hill longer, like scooting back on a slide!',
    tipLine: 'Moving your weights to the back would have won it by {gain}!',
    parentScript:
      'Here is the champion’s secret: where the weight sits matters. Weight at the BACK of the car starts higher up the ramp, and it is still on the slope being pulled forward after a nose-heavy car’s weight has already flattened out. Same push, held longer. On the results screen, watch the rear-weighted cars pull away right at the bottom of the hill.',
    tryAtHome: 'On a playground slide, scoot to sit at the very top edge vs. partway down. From which spot do you reach the bottom faster?',
  },
  friction: {
    id: 'friction',
    icon: 'sparkle',
    title: 'Smooth is fast',
    kidLine: 'Rough and squeaky rubs your speed away — polish those axles and puff the graphite!',
    tipLine: 'Polishing the axles and adding graphite would have won it by {gain}!',
    parentScript:
      'Friction is the slow-down force: tiny bumps on the axle grabbing the wheel every single spin, all the way down the track. Polishing smooths the bumps; graphite (slippery pencil dust!) fills in what is left. Real racers spend more time polishing axles than carving — it is the least glamorous, most powerful trick in the pits.',
    tryAtHome: 'Rub your hands together hard — feel the warmth? That heat is energy friction stole. Now try with soapy hands.',
  },
  aero: {
    id: 'aero',
    icon: 'wind',
    title: 'Slip through the air',
    kidLine: 'The air is in the way! Pointy, low cars sneak through — brick cars have to shove it aside.',
    tipLine: 'A sleeker, lower shape would have won it by {gain}!',
    parentScript:
      'Air does not feel like much, but at racing speed the car has to push a car-sized tunnel through it the whole way down. A low wedge moves less air, and rounded edges let the air close smoothly behind it instead of tumbling. That tumbling — turbulence — pulls backward like a tiny parachute.',
    tryAtHome: 'Drop two identical sheets of paper: one flat, one crumpled into a ball. Same weight — why does one lose to the air?',
  },
  wheels: {
    id: 'wheels',
    icon: 'lift',
    title: 'Three shoes rub less than four',
    kidLine: 'Lift one front wheel off the track — three wheels rub less than four!',
    tipLine: 'Raising one front wheel would have found you {gain} more!',
    parentScript:
      'Every spinning wheel costs twice: friction on its axle, and the energy it takes just to make the wheel spin up. Real derby champions set one front wheel a hair higher so it never touches — the car rides on three. It sounds like cheating; it is just counting. Fewer touching wheels, less rubbing.',
    tryAtHome: 'Spin a bike wheel and count how long it coasts. Now press a finger lightly on the rim. That gentle touch is what a fourth wheel costs.',
  },
}
