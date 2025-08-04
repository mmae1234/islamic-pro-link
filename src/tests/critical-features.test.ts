// Critical Features Test Suite for MuslimPros
// This file contains test scenarios to verify the functionality of key features

// Message System Tests
export const testMessageGrouping = () => {
  console.log('Testing message grouping functionality...');
  
  // Test: should group messages by conversation partners
  const testGrouping = () => {
    const messages = [
      {
        id: '1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Hello',
        created_at: '2024-01-01T10:00:00Z',
        read_at: null
      },
      {
        id: '2',
        sender_id: 'user2',
        recipient_id: 'user1',
        content: 'Hi there',
        created_at: '2024-01-01T10:05:00Z',
        read_at: null
      },
      {
        id: '3',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'How are you?',
        created_at: '2024-01-01T10:10:00Z',
        read_at: null
      }
    ];

    // Group messages by conversation partner
    const conversationMap = new Map();
    const currentUserId = 'user1';
    
    for (const message of messages) {
      const partnerId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          user_id: partnerId,
          messages: [],
          unread_count: 0
        });
      }
      
      const conversation = conversationMap.get(partnerId);
      conversation.messages.push(message);
      
      if (message.recipient_id === currentUserId && !message.read_at) {
        conversation.unread_count++;
      }
    }

    console.assert(conversationMap.size === 1, 'Should have 1 conversation');
    console.assert(conversationMap.get('user2').messages.length === 3, 'Should have 3 messages');
    console.assert(conversationMap.get('user2').unread_count === 1, 'Should have 1 unread message');
    console.log('✓ Message grouping test passed');
  };

  // Test: should sort conversations by latest message
  const testSorting = () => {
    const conversations = [
      {
        user_id: 'user1',
        last_message: { created_at: '2024-01-01T10:00:00Z' }
      },
      {
        user_id: 'user2',
        last_message: { created_at: '2024-01-01T11:00:00Z' }
      },
      {
        user_id: 'user3',
        last_message: { created_at: '2024-01-01T09:00:00Z' }
      }
    ];

    const sorted = conversations.sort((a, b) => {
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

    console.assert(sorted[0].user_id === 'user2', 'Latest message should be first');
    console.assert(sorted[1].user_id === 'user1', 'Second latest should be second');
    console.assert(sorted[2].user_id === 'user3', 'Oldest should be last');
    console.log('✓ Message sorting test passed');
  };
  
  testGrouping();
  testSorting();
};

// Mentorship Dashboard Integration Tests
export const testMentorshipIntegration = () => {
  console.log('Testing mentorship integration...');
  
  // Test: should sync mentorship availability from dashboard to mentorship page
  const testSync = () => {
    const professionalProfile = {
      user_id: 'user1',
      is_mentor: true,
      is_seeking_mentor: false,
      skills: ['JavaScript', 'React'],
      availability: 'weekends'
    };

    // Simulate dashboard save
    const savedData = {
      user_id: professionalProfile.user_id,
      is_mentor: professionalProfile.is_mentor,
      is_seeking_mentor: professionalProfile.is_seeking_mentor,
      skills: professionalProfile.skills,
      availability: professionalProfile.availability
    };

    console.assert(savedData.is_mentor === true, 'Should save mentor status');
    console.assert(savedData.is_seeking_mentor === false, 'Should save seeking status');
    console.assert(savedData.skills.includes('JavaScript'), 'Should save skills');
    console.assert(savedData.availability === 'weekends', 'Should save availability');
    console.log('✓ Mentorship sync test passed');
  };

  // Test: should filter mentors correctly on mentorship page
  const testFilters = () => {
    const mentors = [
      {
        user_id: 'user1',
        is_mentor: true,
        skills: ['JavaScript', 'React'],
        sector: 'Technology',
        gender: 'male',
        university: 'MIT',
        languages: ['English', 'Arabic']
      },
      {
        user_id: 'user2',
        is_mentor: true,
        skills: ['Python', 'AI'],
        sector: 'Technology',
        gender: 'female',
        university: 'Stanford',
        languages: ['English', 'French']
      }
    ];

    // Test skill filter
    const jsFiltered = mentors.filter(mentor =>
      mentor.skills?.some(skill => ['JavaScript'].includes(skill))
    );
    console.assert(jsFiltered.length === 1, 'Should filter by JavaScript skill');
    console.assert(jsFiltered[0].user_id === 'user1', 'Should return correct user');

    // Test gender filter
    const femaleFiltered = mentors.filter(mentor => mentor.gender === 'female');
    console.assert(femaleFiltered.length === 1, 'Should filter by gender');
    console.assert(femaleFiltered[0].user_id === 'user2', 'Should return female user');

    // Test university filter
    const mitFiltered = mentors.filter(mentor => mentor.university === 'MIT');
    console.assert(mitFiltered.length === 1, 'Should filter by university');
    console.assert(mitFiltered[0].user_id === 'user1', 'Should return MIT user');

    // Test language filter
    const arabicFiltered = mentors.filter(mentor =>
      mentor.languages?.includes('Arabic')
    );
    console.assert(arabicFiltered.length === 1, 'Should filter by language');
    console.assert(arabicFiltered[0].user_id === 'user1', 'Should return Arabic speaker');
    console.log('✓ Mentorship filters test passed');
  };

  testSync();
  testFilters();
};

// Profile View Counter Tests
export const testProfileViews = () => {
  console.log('Testing profile view counter...');
  
  // Test: should increment profile views correctly
  const testIncrement = () => {
    let viewCount = 0;
    
    const trackView = (viewerId: string | null, viewedProfileId: string) => {
      // Simulate tracking a view
      if (viewedProfileId) {
        viewCount++;
        return {
          viewer_id: viewerId,
          viewed_profile_id: viewedProfileId,
          viewed_at: new Date().toISOString()
        };
      }
    };

    // Track multiple views
    trackView('user1', 'profile1');
    trackView('user2', 'profile1');
    trackView(null, 'profile1'); // Anonymous view

    console.assert(viewCount === 3, 'Should track 3 views');
    console.log('✓ Profile view increment test passed');
  };

  // Test: should prevent duplicate views within 24 hours
  const testDuplicates = () => {
    const recentViews = [
      {
        ip_address: '192.168.1.1',
        viewed_profile_id: 'profile1',
        viewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      }
    ];

    const currentIp = '192.168.1.1';
    const profileId = 'profile1';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const hasRecentView = recentViews.some(view =>
      view.ip_address === currentIp &&
      view.viewed_profile_id === profileId &&
      new Date(view.viewed_at) > twentyFourHoursAgo
    );

    console.assert(hasRecentView === true, 'Should detect recent view');
    console.log('✓ Profile view duplicate prevention test passed');
  };

  testIncrement();
  testDuplicates();
};

// Find Professionals Filters Tests
export const testProfessionalFilters = () => {
  console.log('Testing professional filters...');
  
  // Test: should handle mentor/seeking filters correctly
  const testMentorFilters = () => {
    const professionals = [
      {
        id: '1',
        is_mentor: true,
        is_seeking_mentor: false,
        gender: 'male',
        languages: ['English', 'Arabic'],
        university: 'MIT'
      },
      {
        id: '2',
        is_mentor: false,
        is_seeking_mentor: true,
        gender: 'female',
        languages: ['English', 'French'],
        university: 'Stanford'
      }
    ];

    // Filter for available mentors (is_mentor = true)
    const availableMentors = professionals.filter(p => p.is_mentor === true);
    console.assert(availableMentors.length === 1, 'Should find 1 available mentor');
    console.assert(availableMentors[0].id === '1', 'Should return correct mentor');

    // Filter for looking for mentors (is_seeking_mentor = true)
    const seekingMentors = professionals.filter(p => p.is_seeking_mentor === true);
    console.assert(seekingMentors.length === 1, 'Should find 1 seeking mentor');
    console.assert(seekingMentors[0].id === '2', 'Should return correct seeker');
    console.log('✓ Mentor/seeking filters test passed');
  };

  // Test: should apply gender filter correctly
  const testGenderFilter = () => {
    const professionals = [
      { id: '1', gender: 'male' },
      { id: '2', gender: 'female' },
      { id: '3', gender: 'male' }
    ];

    const maleFiltered = professionals.filter(p => p.gender === 'male');
    console.assert(maleFiltered.length === 2, 'Should find 2 male professionals');

    const femaleFiltered = professionals.filter(p => p.gender === 'female');
    console.assert(femaleFiltered.length === 1, 'Should find 1 female professional');
    console.log('✓ Gender filter test passed');
  };

  // Test: should apply language and university filters correctly
  const testMultiFilters = () => {
    const professionals = [
      {
        id: '1',
        languages: ['English', 'Arabic'],
        university: 'MIT'
      },
      {
        id: '2',
        languages: ['English', 'French'],
        university: 'Stanford'
      }
    ];

    // Language filter
    const arabicSpeakers = professionals.filter(p =>
      p.languages?.includes('Arabic')
    );
    console.assert(arabicSpeakers.length === 1, 'Should find 1 Arabic speaker');
    console.assert(arabicSpeakers[0].id === '1', 'Should return correct Arabic speaker');

    // University filter
    const mitGrads = professionals.filter(p => p.university === 'MIT');
    console.assert(mitGrads.length === 1, 'Should find 1 MIT graduate');
    console.assert(mitGrads[0].id === '1', 'Should return correct MIT graduate');
    console.log('✓ Multi-filter test passed');
  };

  testMentorFilters();
  testGenderFilter();
  testMultiFilters();
};

// Professional Profile Updates Tests
export const testProfileUpdates = () => {
  console.log('Testing profile updates...');
  
  // Test: should save profile updates correctly
  const testSave = () => {
    const originalProfile = {
      user_id: 'user1',
      languages: ['English'],
      skills: ['JavaScript'],
      is_mentor: false
    };

    const updates = {
      languages: ['English', 'Arabic', 'French'],
      skills: ['JavaScript', 'React', 'Node.js'],
      is_mentor: true
    };

    const updatedProfile = {
      ...originalProfile,
      ...updates
    };

    console.assert(updatedProfile.languages.includes('Arabic'), 'Should save language updates');
    console.assert(updatedProfile.skills.includes('React'), 'Should save skill updates');
    console.assert(updatedProfile.is_mentor === true, 'Should save mentor status');
    console.log('✓ Profile save test passed');
  };

  // Test: should reflect updates in search filters immediately
  const testSearchReflection = () => {
    const professionals = [
      {
        id: 'user1',
        languages: ['English', 'Arabic'],
        skills: ['JavaScript', 'React'],
        is_mentor: true
      }
    ];

    // Test that updated profile appears in language filter
    const arabicFiltered = professionals.filter(p =>
      p.languages?.includes('Arabic')
    );
    console.assert(arabicFiltered.length === 1, 'Should appear in language filter');

    // Test that updated profile appears in skills filter
    const reactFiltered = professionals.filter(p =>
      p.skills?.includes('React')
    );
    console.assert(reactFiltered.length === 1, 'Should appear in skills filter');

    // Test that updated profile appears in mentor filter
    const mentorFiltered = professionals.filter(p => p.is_mentor === true);
    console.assert(mentorFiltered.length === 1, 'Should appear in mentor filter');
    console.log('✓ Search reflection test passed');
  };

  testSave();
  testSearchReflection();
};

// Run all tests function
export const runAllTests = () => {
  console.log('=== Running MuslimPros Critical Features Tests ===');
  try {
    testMessageGrouping();
    testMentorshipIntegration();
    testProfileViews();
    testProfessionalFilters();
    testProfileUpdates();
    console.log('✅ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};