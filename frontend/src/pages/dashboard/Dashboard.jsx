import React, { useState, useEffect} from 'react';
import { Search, Bell, Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Clock, Star, ArrowUpRight, ArrowDownRight, Activity, Zap, Menu} from 'lucide-react';
import { Row, Col, Statistic, Button, Card, Space,Typography, Badge, Modal, Flex} from 'antd';
import {LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';

import './Dashboard.css';
import ProfileSection from '../profile/ProfileSection';
import AdminManagement from '../admin/AdminManagement';
import EmployeeManagement from '../admin/EmployeeManagement';
import ProjectTimeline from '../project/ProjectTimeline';
import ProjectBudgeting from '../project/ProjectBudgeting';
import HRManagement from '../admin/HRManagement';
import JobDescriptionPage from '../job/JobDescriptionPage';
import JobPostPage from '../job/JobPostPage';
import JobApplyPage from '../job/JobApplyPage';
import ResumeListPage from '../job/ResumeListpage';
import InterviewManagementPage from '../job/InterviewManagementPage';
import JobApplicationPage from '../job/JobApplicationPage'
import SelectedCandidatesPage from '../job/SelectedCandidatespage';
import CampusJobApplyPage from '../job/CampusJobApplyPage';
import ExamConductPage from '../job/ExamConductPage';
import EmailClient from '../email/EmailClient';
import PayrollApp from '../hr/Payroll';



import EmployeeAttendancePage from '../hr/EmployeeAttendancePage';
import { supabase } from '../../supabase/config';

const Dashboard = ({ sidebarOpen, activeSection, userData, onLogout, onSectionChange,activeEmailFolder, onToggleSidebar, isEmailAuthenticated, setIsEmailAuthenticated }) => {
  const { Text, Title } = Typography;
  const [currentJobId, setCurrentJobId] = useState(2);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
const [searchQuery, setSearchQuery] = useState('');

  const [attendanceData, setAttendanceData] = useState([]);
const [currentMonth, setCurrentMonth] = useState(new Date());
const [showCalendarModal, setShowCalendarModal] = useState(false);
useEffect(() => {
  console.log('Current userData:', userData);
  console.log('User ID:', userData?.id);
  console.log('User object keys:', userData ? Object.keys(userData) : 'No userData');
}, [userData]);

const fetchAttendanceData = async () => {
  // Check if we have user data and ID
  if (!userData || !userData.id) {
    console.log('No user data or user ID available:', userData);
    return;
  }

  const userId = userData.id; // Get user ID from userData
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Format dates as YYYY-MM-DD
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];

  console.log('Fetching attendance with params:', {
    userId: userId,
    userDataFull: userData,
    startDate: startDate,
    endDate: endDate,
    currentMonth: currentMonth
  });

  try {
    // Make sure you're importing supabase client correctly
    const { data, error } = await supabase
      .from('attendance')
      .select('*') // Select all columns first to see what's there
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    console.log('Supabase query result:', { data, error });

    if (error) {
      console.error('Supabase error details:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No attendance records found for user:', userId);
      console.log('Date range:', startDate, 'to', endDate);
      
      // Let's also check if there's any data at all for this user
      const { data: allUserData, error: allError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .limit(5);
      
      console.log('All attendance records for user (first 5):', allUserData);
      
      setAttendanceData([]);
      return;
    }

    console.log('Successfully fetched attendance data:', data);
    console.log('Number of records found:', data.length);
    
    // Log each record to see the structure
    data.forEach((record, index) => {
      console.log(`Record ${index}:`, {
        id: record.id,
        date: record.date,
        user_id: record.user_id,
        is_present: record.is_present,
        check_in: record.check_in,
        check_out: record.check_out
      });
    });

    setAttendanceData(data);

  } catch (error) {
    console.error('Fetch attendance error:', error);
  }
};
useEffect(() => {
  console.log('useEffect triggered - userData:', userData, 'currentMonth:', currentMonth);
  
  if (userData && userData.id) {
    console.log('Calling fetchAttendanceData...');
    fetchAttendanceData();
  } else {
    console.log('Skipping fetch - no user data');
  }
}, [userData, currentMonth]);
// Move these calculations here, after the useEffect hooks
const presentDays = attendanceData.filter(record => record.is_present === true).length;
const absentDays = attendanceData.filter(record => record.is_present === false).length;
const totalDays = attendanceData.length;
const renderAttendanceCalendar = () => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Create attendance lookup map
  const attendanceMap = {};
  
  console.log('Processing attendance data:', attendanceData);
  
  attendanceData.forEach(record => {
    // Handle different date formats
    let dateKey;
    if (record.date) {
      // Ensure date is in YYYY-MM-DD format
      if (typeof record.date === 'string') {
        dateKey = record.date.split('T')[0]; // Remove time part if exists
      } else {
        dateKey = new Date(record.date).toISOString().split('T')[0];
      }
      
      attendanceMap[dateKey] = {
        isPresent: record.is_present,
        checkIn: record.check_in,
        checkOut: record.check_out,
        totalHours: record.total_hours
      };
      
      console.log('Mapped attendance:', {
        date: dateKey,
        isPresent: record.is_present,
        checkIn: record.check_in,
        checkOut: record.check_out
      });
    }
  });

  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const attendanceInfo = attendanceMap[dateStr];
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    
    let dayClass = 'no-data';
    let tooltipText = `No data for ${dateStr}`;
    
    if (attendanceInfo) {
      if (attendanceInfo.isPresent === true) {
        dayClass = 'present';
        tooltipText = `Present - Check in: ${attendanceInfo.checkIn || 'N/A'}, Check out: ${attendanceInfo.checkOut || 'N/A'}`;
      } else if (attendanceInfo.isPresent === false) {
        dayClass = 'absent';
        tooltipText = `Absent on ${dateStr}`;
      }
    }
    
    calendarDays.push(
      <div 
        key={day}
        className={`calendar-day ${dayClass} ${isToday ? 'today' : ''}`}
        title={tooltipText}
      >
        {day}
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate attendance summary
  // const presentDays = attendanceData.filter(record => record.is_present === true).length;
  // const absentDays = attendanceData.filter(record => record.is_present === false).length;
  // const totalDays = attendanceData.length;

    return (
  <Card 
    size="small"
    style={{ 
      height: '100%',
      border: 'none',
      boxShadow: 'none',
      background: 'transparent'
    }}
    bodyStyle={{ 
      padding: '15px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* Calendar Header */}
    <Flex justify="space-between" align="center" style={{ marginBottom: '15px' }}>
      <Button 
        type="text" 
        icon={<LeftOutlined />}
        size="small"
        onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          color: '#64748b',
          fontSize: '14px'
        }}
      />
      <Title 
        level={5} 
        style={{ 
          margin: 0, 
          fontWeight: 600, 
          color: '#1e293b',
          fontSize: '16px'
        }}
      >
        {monthNames[month]} {year}
      </Title>
      <Button 
        type="text" 
        icon={<RightOutlined />}
        size="small"
        onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          color: '#64748b',
          fontSize: '14px'
        }}
      />
    </Flex>
    
    {/* Attendance Summary */}
    <Card 
      size="small"
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '15px'
      }}
      bodyStyle={{ padding: '10px' }}
    >
      <Row gutter={[16, 8]} justify="space-around">
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Present:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#22c55e' 
              }}
            >
              {presentDays}
            </Text>
          </Flex>
        </Col>
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Absent:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#ef4444' 
              }}
            >
              {absentDays}
            </Text>
          </Flex>
        </Col>
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Total:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#1e293b' 
              }}
            >
              {totalDays}
            </Text>
          </Flex>
        </Col>
      </Row>
    </Card>
    
    {/* Calendar Weekdays */}
    <div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '0px',
  marginBottom: '8px',
  marginRight:"10px"
}}>
  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
    <div key={day} style={{ textAlign: 'center' }}>
      <Text 
        style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#64748b',
          padding: '8px 3px'
        }}
      >
        {day}
      </Text>
    </div>
  ))}
</div>
    
    {/* Calendar Grid */}
    <div style={{ flex: 1, marginBottom: '15px' }}>
      <Row 
        gutter={[4, 4]} 
        style={{ 
          flex: 1, 
  marginBottom: '15px',
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '4px',
  alignItems: 'start'
        }}
      >
        {calendarDays}
      </Row>
    </div>
    
    {/* Calendar Legend */}
    <Flex justify="center" gap={15} style={{ fontSize: '12px' }}>
      <Flex align="center" gap={5}>
        <Badge 
          color="#22c55e" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>Present</Text>
      </Flex>
      <Flex align="center" gap={5}>
        <Badge 
          color="#ef4444" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>Absent</Text>
      </Flex>
      <Flex align="center" gap={5}>
        <Badge 
          color="#94a3b8" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>No Data</Text>
      </Flex>
    </Flex>
  </Card>
);
};

const handleEmailFolderChange = (folder) => {
  if (onSectionChange) {
    onSectionChange(folder); // ✅ Sidebar logic already handles routing + folder
  }
};

  const fuzzySearch = (query, options) => {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return options
      .map(option => {
        const normalizedName = option.name.toLowerCase();
        const keywords = option.keywords || [];
        let score = 0;
        
        // Check exact match with name
        if (normalizedName === normalizedQuery) {
          score = 100;
        }
        // Check if name starts with query
        else if (normalizedName.startsWith(normalizedQuery)) {
          score = 90;
        }
        // Check if name contains query
        else if (normalizedName.includes(normalizedQuery)) {
          score = 80;
        }
        
        // Check keywords for exact matches
        for (const keyword of keywords) {
          const normalizedKeyword = keyword.toLowerCase();
          if (normalizedKeyword === normalizedQuery) {
            score = Math.max(score, 95);
          }
          else if (normalizedKeyword.startsWith(normalizedQuery)) {
            score = Math.max(score, 85);
          }
          else if (normalizedKeyword.includes(normalizedQuery)) {
            score = Math.max(score, 75);
          }
        }
        
        // Fuzzy matching - check if all characters exist in order (only if no other matches)
        if (score === 0) {
          let queryIndex = 0;
          for (let i = 0; i < normalizedName.length && queryIndex < normalizedQuery.length; i++) {
            if (normalizedName[i] === normalizedQuery[queryIndex]) {
              queryIndex++;
            }
          }
          if (queryIndex === normalizedQuery.length) {
            score = 40;
          }
        }
        
        return { ...option, score };
      })
      .filter(option => option.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const searchableSections = [
    { 
      name: 'admin', 
      section: 'admin', 
      keywords: ['admin', 'administrator', 'management', 'manage admin'] 
    },
    { 
      name: 'employee', 
      section: 'employee', 
      keywords: ['employee', 'staff', 'worker', 'manage employee'] 
    },
    { 
      name: 'hr', 
      section: 'Hr', 
      keywords: ['hr', 'human resources', 'recruitment', 'hiring'] 
    },
    { 
      name: 'job description', 
      section: 'job-description', 
      keywords: ['job description', 'jd', 'description', 'job desc'] 
    },
    { 
      name: 'job post', 
      section: 'job-post', 
      keywords: ['job post', 'posting', 'vacancy', 'post job', 'job posting'] 
    },
    { 
      name: 'job application', 
      section: 'job-application', 
      keywords: ['job application', 'application', 'apply job', 'applications'] 
    },
    { 
      name: 'job apply', 
      section: 'job-apply', 
      keywords: ['job apply', 'apply', 'apply for job', 'job applications'] 
    },
    { 
      name: 'interview', 
      section: 'interview-management', 
      keywords: ['interview', 'screening', 'interview management', 'interviews'] 
    },
    { 
      name: 'resume', 
      section: 'resume-list', 
      keywords: ['resume', 'cv', 'curriculum', 'resume list', 'resumes'] 
    },
    { 
      name: 'project timeline', 
      section: 'project-timeline', 
      keywords: ['project timeline', 'timeline', 'schedule', 'project schedule'] 
    },
    { 
      name: 'project budget', 
      section: 'project-budgeting', 
      keywords: ['project budget', 'budget', 'budgeting', 'finance', 'project finance'] 
    },
    { 
  name: 'employee attendance', 
  section: 'employee-attendance', 
  keywords: ['employee attendance', 'attendance', 'employee time', 'check in', 'check out'] 
}
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      
      const results = fuzzySearch(searchQuery, searchableSections);
      console.log('Search results:', results);
      
      if (results.length > 0) {
        console.log('Navigating to:', results[0].section);
        console.log('Match details:', {
          name: results[0].name,
          section: results[0].section,
          score: results[0].score
        });
        
        if (onSectionChange) {
          onSectionChange(results[0].section);
        }
        setSearchQuery('');
      } else {
        console.log('No results found for:', searchQuery);
        alert(`No results found for "${searchQuery}"`);
      }
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      const suggestions = fuzzySearch(value, searchableSections).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Common header component to avoid repetition
  const renderHeader = (placeholder = "Search projects, users, or documents...") => (
    <header className="dashboard-header">
      <button 
        className="mobile-menu-button"

        onClick={onToggleSidebar}
        style={{ marginLeft: '10px' }}
      >
        <Menu size={24} />
      </button>
      
      <div className="search-container">
        <Search size={22} className="search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyPress={handleSearch}
          className="search-input"
        />
        
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="search-suggestions">
            {searchSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="search-suggestion-item"
                onClick={() => handleSuggestionClick(suggestion.section)}
              >
                {suggestion.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="notification-button">
          <Bell size={22} />
          <span className="notification-badge"></span>
        </button>
        <ProfileSection userData={userData} onLogout={onLogout}/>
      </div>
    </header>
  );

  const statsData = [
    { 
      title: 'Total Users', 
      value: '12,543', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      title: 'Revenue', 
      value: '$89,231', 
      change: '+8.2%', 
      trend: 'up', 
      icon: DollarSign, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      title: 'Orders', 
      value: '3,847', 
      change: '+23.1%', 
      trend: 'up', 
      icon: ShoppingCart, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      title: 'Conversion Rate', 
      value: '4.7%', 
      change: '-2.3%', 
      trend: 'down', 
      icon: TrendingUp, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    { 
  title: 'Attendance Calendar', 
  value: `${presentDays}/${totalDays}`, // Show present/total instead of empty
  change: `${((presentDays/totalDays) * 100 || 0).toFixed(1)}%`, // Show percentage
  trend: 'calendar', 
  icon: Calendar, 
  color: '#8b5cf6',
  bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  isCalendar: true,
  showOverview: false // Add this state flag
}
  ];

  const quickActions = [
    { title: 'Create New Project', icon: Zap, color: '#8b5cf6' },
    { title: 'Schedule Meeting', icon: Calendar, color: '#06b6d4' },
    { title: 'View Reports', icon: Activity, color: '#10b981' },
    { title: 'Manage Team', icon: Users, color: '#f59e0b' }
  ];

  const recentActivities = [
    { 
      action: 'New user registration', 
      detail: 'sarah.johnson@company.com', 
      time: '',
      type: 'user'
    },
    { 
      action: 'Order completed', 
      detail: 'Order #ORD-2024-1847 - $299.00', 
      time: '5 minutes ago',
      type: 'order'
    },
    { 
      action: 'Payment received', 
      detail: 'Stripe payment - $1,247.50', 
      time: '12 minutes ago',
      type: 'payment'
    },
    { 
      action: 'New message', 
      detail: 'Customer support inquiry', 
      time: '18 minutes ago',
      type: 'message'
    },
    { 
      action: 'System backup', 
      detail: 'Database backup completed successfully', 
      time: '25 minutes ago',
      type: 'system'
    }
  ];
if (activeSection === 'mails') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader("Search emails...")}
      <main className="main-content">
        <EmailClient 
          userRole={userData?.role}
          activeFolder={activeEmailFolder}
          onFolderChange={handleEmailFolderChange}
          onAuthSuccess={() => setIsEmailAuthenticated(true)}
          onLogout={() => setIsEmailAuthenticated(false)}
        />
      </main>
    </div>
  );
}



  // Handle email section clicks
  const handleEmailSectionClick = (section) => {
    if (section === 'inbox' || section === 'compose') {
      setActiveEmailFolder(section);
      onSectionChange('mails'); // Always go to mails section
    } else {
      onSectionChange(section);
    }
  };
  // Render different sections based on activeSection
  if (activeSection === 'admin') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search projects, users, or documents...")}
        <main className="main-content">
          <AdminManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'project-budgeting') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search project budgeting...")}
        <main className="main-content">
          <ProjectBudgeting userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'employee') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search employees...")}
        <main className="main-content">
          <EmployeeManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'Hr') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search HR data...")}
        <main className="main-content">
          <HRManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
if (activeSection === 'employee-attendance') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
          <EmployeeAttendancePage userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'job-description') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
          <JobDescriptionPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'exam-conduct-page') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search exam conduct...")}
        <main className="main-content">
          <ExamConductPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'on-campus-data') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search campus data...")}
        <main className="main-content">
          <CampusJobApplyPage userRole={userData?.role} />
        </main>
      </div>
    );
  }
if (activeSection === 'payroll') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search payroll...")}
        <main className="main-content">
          <PayrollApp userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'selected-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search selected candidates...")}
        <main className="main-content">
          <SelectedCandidatesPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-post') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job posts...")}
        <main className="main-content">
          <JobPostPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'selected-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search selected candidates...")}
        <main className="main-content">
          <SelectedCandidatesPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-application') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job applications...")}
        <main className="main-content">
          <JobApplicationPage userRole={userData?.role} jobId={currentJobId} />
        </main>
      </div>
    );
  }

  if (activeSection === 'interview-management') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search interview management...")}
        <main className="main-content">
          <InterviewManagementPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-apply') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job applications...")}
        <main className="main-content">
          <JobApplyPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'resume-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search resume list...")}
        <main className="main-content">
          <ResumeListPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'project-timeline') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search project timeline...")}
        <main className="main-content">
          <ProjectTimeline userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'employee-attendance') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader("Search employee attendance...")}
      <main className="main-content">
        <EmployeeAttendancePage userRole={userData?.role} />
      </main>
    </div>
  );
}
  // Default dashboard content
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader()}
      
      <main className="main-content">
        <div className="content-container">
          {/* Welcome Header */}
          <div className="welcome-header">
            <h1 className="welcome-title">
              Welcome back, {userData?.name || userData?.displayName || 'User'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening with your business today. You have 3 new notifications.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
  {statsData.map((stat, index) => (
    <div
      key={index}
      className={`stats-card ${stat.isCalendar ? 'calendar-card' : ''} animate-${index + 1}`}
    >
      <div 
        className="stats-bg-decoration"
        style={{ background: stat.bgGradient }}
      />
      
      <div className="stats-header">
        <div 
          className="stats-icon"
          style={{
            background: stat.bgGradient,
            boxShadow: `0 8px 24px ${stat.color}30`
          }}
        >
          <stat.icon size={26} color="white" />
        </div>
        {!stat.isCalendar && (
          <div className={`stats-change ${stat.trend}`}>
            {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {stat.change}
          </div>
        )}
      </div>
      
      <h3 className="stats-title">
        {stat.title}
      </h3>
      
        {stat.isCalendar ? (
  <div className="stats-calendar-container">
    <div className="calendar-summary">
  <Row gutter={[16, 16]} justify="center" align="middle" style={{ height: '100%' }}>
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={presentDays} 
          valueStyle={{ 
            color: '#22c55e', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Present
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={absentDays} 
          valueStyle={{ 
            color: '#ef4444', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Absent
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={totalDays} 
          valueStyle={{ 
            color: '#1e293b', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Total
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Button 
          type="primary"
          size="small"
          icon={<CalendarOutlined />}
          onClick={() => setShowCalendarModal(true)}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            height: '32px',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Overview
        </Button>
      </div>
    </Col>
  </Row>
</div>
  </div>
) : (
  <div className="stats-value">
    {stat.value}
  </div>
)}

    </div>
  ))}
</div>
 {/* Calendar Modal */}
      <Modal
        title="Attendance Calendar"
        open={showCalendarModal}
        onCancel={() => setShowCalendarModal(false)}
        footer={null}
        width={600}
        centered
      >
        {renderAttendanceCalendar()}
      </Modal>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">
              Quick Actions
            </h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className={`quick-action-card animate-${index + 1}`}
                >
                  <div className="quick-action-content">
                    <div 
                      className="quick-action-icon"
                      style={{
                        backgroundColor: action.color,
                        boxShadow: `0 4px 15px ${action.color}30`
                      }}
                    >
                      <action.icon size={22} color="white" />
                    </div>
                    <span className="quick-action-title">
                      {action.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="activity-header">
              <h2 className="section-title">
                Recent Activity
              </h2>
              <span className="activity-subtitle">
                Last 24 hours
              </span>
            </div>
            
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-dot ${activity.type}`} />
                  <div className="activity-content">
                    <div className="activity-action">
                      {activity.action}
                    </div>
                    <div className="activity-detail">
                      {activity.detail}
                    </div>
                  </div>
                  <div className="activity-time">
                    <Clock size={14} />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;