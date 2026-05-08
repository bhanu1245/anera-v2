import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

// Demo profile data for the discover feature
const DEMO_PROFILES = [
  {
    name: 'Priya Sharma', age: 26, gender: 'female',
    bio: 'Dancing through life, one Bollywood song at a time. Coffee addict & sunset chaser. 💃',
    interests: ['Dancing', 'Music', 'Travel', 'Coffee', 'Photography'],
    city: 'Mumbai', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/women/45.jpg'],
  },
  {
    name: 'Arjun Mehta', age: 29, gender: 'male',
    bio: 'Tech by day, chef by night. I make a mean butter chicken.',
    interests: ['Cooking', 'Tech', 'Fitness', 'Travel', 'Movies'],
    city: 'Bangalore', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/32.jpg', 'https://randomuser.me/api/portraits/men/33.jpg'],
  },
  {
    name: 'Nisha Patel', age: 24, gender: 'female',
    bio: 'Yoga instructor & plant mom. Finding peace in every breath. ✨',
    interests: ['Yoga', 'Meditation', 'Nature', 'Gardening', 'Reading'],
    city: 'Pune', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/women/68.jpg', 'https://randomuser.me/api/portraits/women/69.jpg'],
  },
  {
    name: 'Rohan Kapoor', age: 31, gender: 'male',
    bio: 'Startup founder who still makes time for weekend treks. 🏔️',
    interests: ['Hiking', 'Tech', 'Photography', 'Sports', 'Coffee'],
    city: 'Delhi', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/75.jpg', 'https://randomuser.me/api/portraits/men/76.jpg'],
  },
  {
    name: 'Ananya Reddy', age: 27, gender: 'female',
    bio: 'Fashion designer with a passport full of stamps. 🌍',
    interests: ['Fashion', 'Travel', 'Art', 'Photography', 'Wine'],
    city: 'Hyderabad', relationshipIntent: 'casual',
    photos: ['https://randomuser.me/api/portraits/women/17.jpg', 'https://randomuser.me/api/portraits/women/18.jpg'],
  },
  {
    name: 'Vikram Singh', age: 28, gender: 'male',
    bio: 'Cricketer, dog dad, and aspiring novelist. 🐕',
    interests: ['Sports', 'Pets', 'Writing', 'Movies', 'Cooking'],
    city: 'Chennai', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/52.jpg', 'https://randomuser.me/api/portraits/men/53.jpg'],
  },
  {
    name: 'Meera Joshi', age: 25, gender: 'female',
    bio: 'Doctor by profession, foodie by passion. I know the best hidden restaurants. 🍜',
    interests: ['Food', 'Cooking', 'Travel', 'Movies', 'Music'],
    city: 'Mumbai', relationshipIntent: 'not-sure',
    photos: ['https://randomuser.me/api/portraits/women/33.jpg', 'https://randomuser.me/api/portraits/women/34.jpg'],
  },
  {
    name: 'Karan Malhotra', age: 30, gender: 'male',
    bio: 'Architect who believes in building relationships as strong as my designs. 🍺',
    interests: ['Cycling', 'Art', 'Travel', 'Wine', 'Photography'],
    city: 'Bangalore', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/11.jpg', 'https://randomuser.me/api/portraits/men/12.jpg'],
  },
  {
    name: 'Sara Khan', age: 23, gender: 'female',
    bio: 'Film student & indie music lover. I can quote entire movies. 🎬',
    interests: ['Movies', 'Music', 'Art', 'Photography', 'Coffee'],
    city: 'Delhi', relationshipIntent: 'casual',
    photos: ['https://randomuser.me/api/portraits/women/55.jpg', 'https://randomuser.me/api/portraits/women/56.jpg'],
  },
  {
    name: 'Aditya Nair', age: 27, gender: 'male',
    bio: 'Software engineer who codes for a living and surfs for the soul. 🏄‍♂️',
    interests: ['Swimming', 'Tech', 'Travel', 'Music', 'Fitness'],
    city: 'Goa', relationshipIntent: 'casual',
    photos: ['https://randomuser.me/api/portraits/men/22.jpg', 'https://randomuser.me/api/portraits/men/23.jpg'],
  },
  {
    name: 'Diya Gupta', age: 26, gender: 'female',
    bio: 'Journalist & bookworm. I tell stories for a living. 📚',
    interests: ['Reading', 'Writing', 'Coffee', 'Travel', 'Movies'],
    city: 'Kolkata', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/women/81.jpg', 'https://randomuser.me/api/portraits/women/82.jpg'],
  },
  {
    name: 'Ishaan Verma', age: 32, gender: 'male',
    bio: 'Photographer & world traveler. 30+ countries and counting. 📸',
    interests: ['Photography', 'Travel', 'Hiking', 'Art', 'Nature'],
    city: 'Jaipur', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/41.jpg', 'https://randomuser.me/api/portraits/men/42.jpg'],
  },
  {
    name: 'Tanya Bose', age: 25, gender: 'female',
    bio: 'Startup PM by day, pottery artist by night. 🎨',
    interests: ['Art', 'Gardening', 'Cooking', 'Yoga', 'Nature'],
    city: 'Pune', relationshipIntent: 'networking',
    photos: ['https://randomuser.me/api/portraits/women/9.jpg', 'https://randomuser.me/api/portraits/women/10.jpg'],
  },
  {
    name: 'Rahul Desai', age: 29, gender: 'male',
    bio: 'Gym rat with a soft side. I lift heavy things and write poetry. 💪',
    interests: ['Fitness', 'Writing', 'Cooking', 'Music', 'Meditation'],
    city: 'Mumbai', relationshipIntent: 'serious',
    photos: ['https://randomuser.me/api/portraits/men/62.jpg', 'https://randomuser.me/api/portraits/men/63.jpg'],
  },
  {
    name: 'Lavanya Iyer', age: 24, gender: 'female',
    bio: 'Classical dancer meets modern world. Bharatanatyam by training, EDM by choice. 🎭',
    interests: ['Dancing', 'Music', 'Art', 'Travel', 'Fashion'],
    city: 'Chennai', relationshipIntent: 'friendship',
    photos: ['https://randomuser.me/api/portraits/women/28.jpg', 'https://randomuser.me/api/portraits/women/29.jpg'],
  },
];

/**
 * Reset the demo user's swipes and matches, then create incoming likes
 * so the demo user can discover profiles and get matches when they like back.
 */
async function resetDemoUserSwipes(demoUserId: string): Promise<{ deletedSwipes: number; deletedMatches: number; createdLikes: number }> {
  // 1. Delete all swipes FROM the demo user (so discover shows all profiles again)
  const deletedOutgoing = await db.swipe.deleteMany({
    where: { fromUserId: demoUserId },
  });

  // 2. Delete all matches involving the demo user
  const deletedMatches = await db.match.deleteMany({
    where: {
      OR: [{ user1Id: demoUserId }, { user2Id: demoUserId }],
    },
  });

  // 3. Delete any existing incoming likes TO the demo user from demo profiles
  // (so we can re-create them cleanly without unique constraint errors)
  const demoUsers = await db.user.findMany({
    where: { email: { endsWith: '@anera.demo' } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  const deletedIncoming = await db.swipe.deleteMany({
    where: {
      toUserId: demoUserId,
      fromUserId: { in: demoUserIds },
      action: { in: ['like', 'superlike'] },
    },
  });

  // 4. Create incoming likes from some demo profiles to the demo user
  // This way, when the demo user likes them back, a match is created
  // IMPORTANT: Use createdAt: 'desc' so the profiles shown FIRST in discover
  // (which also uses desc ordering) are the ones who already liked the user.
  // This ensures that when the demo user swipes right, they get a match!
  let createdLikes = 0;
  const likerProfiles = await db.profile.findMany({
    where: {
      userId: { in: demoUserIds },
      isOnboarded: true,
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  for (const liker of likerProfiles) {
    try {
      await db.swipe.create({
        data: {
          fromUserId: liker.userId,
          toUserId: demoUserId,
          action: likerProfiles.indexOf(liker) === 0 ? 'superlike' : 'like',
        },
      });
      createdLikes++;
    } catch {
      // Ignore unique constraint errors (already swiped)
    }
  }

  return {
    deletedSwipes: deletedOutgoing.count + deletedIncoming.count,
    deletedMatches: deletedMatches.count,
    createdLikes,
  };
}

// POST /api/seed/bulk - Seed multiple demo profiles for discover
export async function POST() {
  try {
    // Quick check: count existing profiles (excluding demo user)
    const existingCount = await db.profile.count({
      where: { name: { not: 'Alex Rivera' } },
    });

    // If profiles already exist, reset demo user swipes and return
    if (existingCount >= DEMO_PROFILES.length) {
      const allProfiles = await db.profile.findMany({
        where: { isOnboarded: true },
        include: { photos: { orderBy: { order: 'asc' } } },
      });

      const existingDemo = await db.user.findUnique({ where: { email: 'demo@anera.app' } });

      // Reset demo user's swipes so they can see all profiles again
      let resetResult = { deletedSwipes: 0, deletedMatches: 0, createdLikes: 0 };
      if (existingDemo) {
        resetResult = await resetDemoUserSwipes(existingDemo.id);
      }

      return NextResponse.json({
        message: `Already seeded: ${existingCount} profiles (swipes reset)`,
        profiles: allProfiles.map((p) => ({
          ...p,
          interests: JSON.parse(p.interests),
        })),
        userId: existingDemo?.id,
        reset: resetResult,
      });
    }

    // Seed profiles one by one (SQLite doesn't support batch create well)
    const createdProfiles = [];

    for (const demoData of DEMO_PROFILES) {
      const existing = await db.profile.findFirst({
        where: { name: demoData.name },
      });

      if (existing) {
        const withPhotos = await db.profile.findUnique({
          where: { id: existing.id },
          include: { photos: { orderBy: { order: 'asc' } } },
        });
        if (withPhotos) {
          createdProfiles.push({ ...withPhotos, interests: JSON.parse(withPhotos.interests) });
        }
        continue;
      }

      const email = `${demoData.name.toLowerCase().replace(/\s+/g, '.')}@anera.demo`;
      const user = await db.user.create({ data: { email, name: demoData.name } });

      const profile = await db.profile.create({
        data: {
          userId: user.id,
          name: demoData.name,
          age: demoData.age,
          gender: demoData.gender,
          bio: demoData.bio,
          interests: JSON.stringify(demoData.interests),
          city: demoData.city,
          relationshipIntent: demoData.relationshipIntent,
          isOnboarded: true,
        },
      });

      const photoRecords = await Promise.all(
        demoData.photos.map((url, i) =>
          db.photo.create({
            data: { profileId: profile.id, url, order: i, isPrimary: i === 0 },
          })
        )
      );

      createdProfiles.push({
        ...profile,
        interests: JSON.parse(profile.interests),
        photos: photoRecords,
      });
    }

    // Ensure demo user
    let existingDemo = await db.user.findUnique({ where: { email: 'demo@anera.app' } });
    let demoUserId: string;

    if (!existingDemo) {
      const demoUser = await db.user.create({
        data: { email: 'demo@anera.app', name: 'Demo User' },
      });
      demoUserId = demoUser.id;

      const existingProfile = await db.profile.findUnique({ where: { userId: demoUser.id } });
      if (!existingProfile) {
        await db.profile.create({
          data: {
            userId: demoUser.id,
            name: 'Alex Rivera',
            age: 28,
            gender: 'male',
            bio: 'Adventure seeker, coffee lover, and aspiring chef. Looking for someone to explore the city with!',
            interests: JSON.stringify(['Travel', 'Photography', 'Cooking', 'Coffee', 'Hiking']),
            city: 'Mumbai',
            relationshipIntent: 'serious',
            isOnboarded: true,
          },
        });
      }

      // Reset swipes for the new demo user + create incoming likes
      const resetResult = await resetDemoUserSwipes(demoUser.id);

      const token = createSessionToken(demoUser.id);
      const response = NextResponse.json({
        message: `Seeded ${createdProfiles.length} demo profiles`,
        profiles: createdProfiles,
        userId: demoUser.id,
        reset: resetResult,
      });
      setSessionCookie(response, token);
      return response;
    }

    demoUserId = existingDemo.id;

    // Reset demo user's swipes so they can see all profiles again + create incoming likes
    const resetResult = await resetDemoUserSwipes(demoUserId);

    return NextResponse.json({
      message: `Seeded ${createdProfiles.length} demo profiles`,
      profiles: createdProfiles,
      userId: demoUserId,
      reset: resetResult,
    });
  } catch (error) {
    console.error('Error seeding bulk profiles:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo profiles' },
      { status: 500 }
    );
  }
}
