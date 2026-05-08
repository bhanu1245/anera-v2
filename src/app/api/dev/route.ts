import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// ─── Production Guard ────────────────────────────────────────────────────────
// All /api/dev routes are only available in development mode.

function devGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev tools are not available in production' },
      { status: 403 }
    );
  }
  return null;
}

// GET /api/dev - Get all registered users with profile info + counts
export async function GET(request: NextRequest) {
  const guard = devGuard();
  if (guard) return guard;

  try {
    const users = await db.user.findMany({
      include: {
        profile: {
          include: { photos: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get aggregate counts
    const [
      totalMatches,
      totalMessages,
      totalNotifications,
      totalSwipes,
      totalProfiles,
    ] = await Promise.all([
      db.match.count(),
      db.message.count(),
      db.notification.count(),
      db.swipe.count(),
      db.profile.count(),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        passwordHash: u.passwordHash ? '------' : null,
        hasPassword: !!u.passwordHash,
        createdAt: u.createdAt.toISOString(),
        profile: u.profile
          ? {
              ...u.profile,
              interests: JSON.parse(u.profile.interests),
            }
          : null,
      })),
      stats: {
        totalUsers: users.length,
        totalProfiles,
        totalMatches,
        totalMessages,
        totalNotifications,
        totalSwipes,
      },
    });
  } catch (error) {
    console.error('[GET /api/dev] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dev data' },
      { status: 500 }
    );
  }
}

// POST /api/dev - Execute dev actions
// Body: { action: string, ...params }
export async function POST(request: NextRequest) {
  const guard = devGuard();
  if (guard) return guard;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'login-as': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const token = createSessionToken(user.id);
        const profile = await db.profile.findUnique({ where: { userId: user.id } });
        const response = NextResponse.json({
          success: true,
          userId: user.id,
          token,
          needsOnboarding: !profile,
        });
        setSessionCookie(response, token);
        return response;
      }

      case 'reset-database': {
        // Delete all data in correct order (respecting foreign keys)
        await db.notification.deleteMany();
        await db.message.deleteMany();
        await db.match.deleteMany();
        await db.swipe.deleteMany();
        await db.engagementAction.deleteMany();
        await db.userStreak.deleteMany();
        await db.deviceToken.deleteMany();
        await db.photo.deleteMany();
        await db.profile.deleteMany();
        await db.user.deleteMany();

        return NextResponse.json({
          success: true,
          message: 'Database reset complete. All data deleted.',
        });
      }

      case 'seed-demo-profiles': {
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

        let created = 0;
        let skipped = 0;

        for (const demoData of DEMO_PROFILES) {
          const existing = await db.profile.findFirst({
            where: { name: demoData.name },
          });

          if (existing) {
            skipped++;
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

          await Promise.all(
            demoData.photos.map((url, i) =>
              db.photo.create({
                data: { profileId: profile.id, url, order: i, isPrimary: i === 0 },
              })
            )
          );

          created++;
        }

        return NextResponse.json({
          success: true,
          message: `Seeded ${created} demo profiles (${skipped} already existed)`,
          created,
          skipped,
        });
      }

      case 'create-random-match': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Find all other users with profiles (not the current user)
        const otherProfiles = await db.profile.findMany({
          where: {
            userId: { not: userId },
            isOnboarded: true,
          },
          include: { photos: { orderBy: { order: 'asc' } } },
        });

        if (otherProfiles.length === 0) {
          return NextResponse.json(
            { error: 'No other profiles available to match with. Seed demo profiles first.' },
            { status: 400 }
          );
        }

        // Pick a random profile that isn't already matched
        const existingMatches = await db.match.findMany({
          where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
          select: { user1Id: true, user2Id: true },
        });
        const matchedUserIds = new Set(
          existingMatches.flatMap((m) => [m.user1Id, m.user2Id])
        );
        matchedUserIds.delete(userId);

        const availableProfiles = otherProfiles.filter(
          (p) => !matchedUserIds.has(p.userId)
        );

        if (availableProfiles.length === 0) {
          return NextResponse.json(
            { error: 'Already matched with all available profiles.' },
            { status: 400 }
          );
        }

        const randomProfile =
          availableProfiles[Math.floor(Math.random() * availableProfiles.length)];

        // Create mutual likes (swipes)
        try {
          await db.swipe.create({
            data: { fromUserId: userId, toUserId: randomProfile.userId, action: 'like' },
          });
        } catch {
          // May already exist
        }
        try {
          await db.swipe.create({
            data: { fromUserId: randomProfile.userId, toUserId: userId, action: 'like' },
          });
        } catch {
          // May already exist
        }

        // Create match
        const [user1Id, user2Id] =
          userId < randomProfile.userId
            ? [userId, randomProfile.userId]
            : [randomProfile.userId, userId];

        let match;
        try {
          match = await db.match.create({ data: { user1Id, user2Id } });
        } catch {
          match = await db.match.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
          });
        }

        // Create match notifications for both users
        if (match) {
          const userProfile = await db.profile.findUnique({
            where: { userId },
            select: { name: true },
          });
          const otherName = randomProfile.name;
          const userName = userProfile?.name || 'Someone';

          await Promise.all([
            createNotification({
              userId,
              type: 'new_match',
              title: "It's a Match! 🎉",
              body: `You and ${otherName} liked each other!`,
              fromUserId: randomProfile.userId,
              entityId: match.id,
              entityType: 'match',
              imageUrl: randomProfile.photos?.[0]?.url || undefined,
            }).catch(() => {}),
            createNotification({
              userId: randomProfile.userId,
              type: 'new_match',
              title: "It's a Match! 🎉",
              body: `You and ${userName} liked each other!`,
              fromUserId: userId,
              entityId: match.id,
              entityType: 'match',
              imageUrl: undefined,
            }).catch(() => {}),
          ]);
        }

        return NextResponse.json({
          success: true,
          match: match
            ? {
                id: match.id,
                matchedWith: {
                  ...randomProfile,
                  interests: JSON.parse(randomProfile.interests),
                },
              }
            : null,
          message: match
            ? `Matched with ${randomProfile.name}!`
            : 'Match already existed.',
        });
      }

      case 'clear-swipes': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const deletedSwipes = await db.swipe.deleteMany({
          where: { fromUserId: userId },
        });

        const deletedMatches = await db.match.deleteMany({
          where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
        });

        return NextResponse.json({
          success: true,
          deletedSwipes: deletedSwipes.count,
          deletedMatches: deletedMatches.count,
          message: `Cleared ${deletedSwipes.count} swipes and ${deletedMatches.count} matches`,
        });
      }

      case 'generate-test-messages': {
        const { userId, matchId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Find or create a match for this user
        let targetMatchId = matchId as string | undefined;
        let otherUserId: string | undefined;

        if (targetMatchId) {
          const match = await db.match.findUnique({ where: { id: targetMatchId } });
          if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
          }
          otherUserId =
            match.user1Id === userId ? match.user2Id : match.user1Id;
        } else {
          // Find any existing match
          const existingMatch = await db.match.findFirst({
            where: {
              OR: [{ user1Id: userId }, { user2Id: userId }],
            },
          });

          if (existingMatch) {
            targetMatchId = existingMatch.id;
            otherUserId =
              existingMatch.user1Id === userId
                ? existingMatch.user2Id
                : existingMatch.user1Id;
          } else {
            // Need to create a match first
            const otherProfile = await db.profile.findFirst({
              where: { userId: { not: userId }, isOnboarded: true },
            });

            if (!otherProfile) {
              return NextResponse.json(
                { error: 'No other profiles available. Seed demo profiles first.' },
                { status: 400 }
              );
            }

            otherUserId = otherProfile.userId;

            // Create mutual likes
            try {
              await db.swipe.create({
                data: { fromUserId: userId, toUserId: otherUserId, action: 'like' },
              });
            } catch { /* may exist */ }
            try {
              await db.swipe.create({
                data: { fromUserId: otherUserId, toUserId: userId, action: 'like' },
              });
            } catch { /* may exist */ }

            const [user1Id, user2Id] =
              userId < otherUserId
                ? [userId, otherUserId]
                : [otherUserId, userId];

            try {
              const newMatch = await db.match.create({ data: { user1Id, user2Id } });
              targetMatchId = newMatch.id;
            } catch {
              const existing = await db.match.findUnique({
                where: { user1Id_user2Id: { user1Id, user2Id } },
              });
              targetMatchId = existing?.id;
            }
          }
        }

        if (!targetMatchId || !otherUserId) {
          return NextResponse.json(
            { error: 'Could not find or create a match' },
            { status: 500 }
          );
        }

        // Get profile names
        const otherProfile = await db.profile.findUnique({
          where: { userId: otherUserId },
          select: { name: true },
        });
        const userProfile = await db.profile.findUnique({
          where: { userId },
          select: { name: true },
        });
        const otherName = otherProfile?.name || 'Them';
        const userName = userProfile?.name || 'You';

        // Generate conversation messages
        const conversations = [
          [
            { sender: 'other', text: `Hey ${userName}! Great to match with you 😊` },
            { sender: 'user', text: `Hi ${otherName}! Loved your profile! What are you up to?` },
            { sender: 'other', text: 'Just got back from a hike actually! The views were incredible 🏔️' },
            { sender: 'user', text: 'That sounds amazing! Where did you go?' },
            { sender: 'other', text: 'A trail near my city. You should totally check it out sometime!' },
            { sender: 'user', text: "I'd love that! Maybe we could go together sometime? 😄" },
            { sender: 'other', text: "That would be fun! Let's plan something 🎉" },
          ],
          [
            { sender: 'user', text: `Hey ${otherName}! I noticed we both love coffee ☕` },
            { sender: 'other', text: 'Yes! I am a total coffee snob haha. French press or pour over?' },
            { sender: 'user', text: 'Pour over all the way! There is this great cafe I know' },
            { sender: 'other', text: 'Ooh where? I am always looking for new spots!' },
          ],
        ];

        const selectedConv = conversations[Math.floor(Math.random() * conversations.length)];

        const messages = [];
        for (let i = 0; i < selectedConv.length; i++) {
          const msg = selectedConv[i];
          const senderId = msg.sender === 'user' ? userId : otherUserId;
          const createdAt = new Date(Date.now() - (selectedConv.length - i) * 60000 * 5);

          const message = await db.message.create({
            data: {
              matchId: targetMatchId,
              senderId,
              content: msg.text,
              isRead: true,
              createdAt,
            },
          });
          messages.push(message);
        }

        // Create a notification for the last message
        const lastMsg = messages[messages.length - 1];
        const lastSenderProfile = await db.profile.findUnique({
          where: { userId: lastMsg.senderId },
          include: { photos: { where: { isPrimary: true }, take: 1 } },
        });

        if (lastMsg.senderId !== userId) {
          await createNotification({
            userId,
            type: 'new_message',
            title: 'New Message',
            body: `${lastSenderProfile?.name || 'Someone'} sent you a message`,
            fromUserId: lastMsg.senderId,
            entityId: targetMatchId,
            entityType: 'message',
            imageUrl: lastSenderProfile?.photos[0]?.url || undefined,
          }).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          matchId: targetMatchId,
          messageCount: messages.length,
          message: `Generated ${messages.length} test messages`,
        });
      }

      case 'generate-notifications': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const otherProfiles = await db.profile.findMany({
          where: { userId: { not: userId }, isOnboarded: true },
          take: 5,
        });

        const notificationTypes = [
          {
            type: 'someone_liked' as const,
            title: 'Someone likes you! 💕',
            body: `${otherProfiles[0]?.name || 'Someone'} liked your profile.`,
          },
          {
            type: 'superlike_received' as const,
            title: 'You got a Super Like! ⭐',
            body: `${otherProfiles[1]?.name || 'Someone'} Super Liked you!`,
          },
          {
            type: 'profile_viewed' as const,
            title: 'Profile View',
            body: `${otherProfiles[2]?.name || 'Someone'} viewed your profile.`,
          },
          {
            type: 'streak_reminder' as const,
            title: 'Your streak is at risk! 🔥',
            body: 'Come back today to keep your streak going!',
          },
          {
            type: 'people_waiting' as const,
            title: '3 people are waiting for you',
            body: 'You have likes waiting. Check them out!',
          },
          {
            type: 'boost_expired' as const,
            title: 'Boost Expired',
            body: 'Your boost has expired. Get another to increase your visibility!',
          },
        ];

        const created = [];
        for (const notif of notificationTypes) {
          const fromUserId =
            otherProfiles[Math.floor(Math.random() * otherProfiles.length)]?.userId || undefined;

          const result = await createNotification({
            userId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            fromUserId,
            entityType: notif.type === 'streak_reminder' ? 'streak' : 'profile',
          });
          created.push(result);
        }

        return NextResponse.json({
          success: true,
          count: created.length,
          message: `Generated ${created.length} test notifications`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[POST /api/dev] Error:', error);
    return NextResponse.json(
      { error: 'Dev action failed', details: String(error) },
      { status: 500 }
    );
  }
}
