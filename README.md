# EduNova School Management System - Completely Separated Apps

This project has been completely separated into two independent Teacher and Parent/Student applications with no shared dependencies.

## Project Structure

```
edu-sis-paragon/
├── apps/
│   ├── teacher-app/           # Complete Teacher application
│   │   ├── App.js            # Teacher app entry point
│   │   ├── package.json      # Teacher app dependencies
│   │   ├── app.json          # Teacher app configuration
│   │   ├── assets/           # Teacher app assets
│   │   └── src/              # All teacher app source code
│   │       ├── components/   # Teacher-specific components
│   │       ├── contexts/     # Teacher contexts (Theme, Language, etc.)
│   │       ├── services/     # Teacher API services
│   │       ├── utils/        # Teacher utility functions
│   │       ├── hooks/        # Teacher custom hooks
│   │       ├── screens/      # Teacher screens
│   │       └── config/       # Teacher configuration
│   └── parent-student-app/    # Complete Parent/Student application
│       ├── App.js            # Parent/Student app entry point
│       ├── package.json      # Parent/Student app dependencies
│       ├── app.json          # Parent/Student app configuration
│       ├── assets/           # Parent/Student app assets
│       └── src/              # All parent/student app source code
│           ├── components/   # Parent/Student-specific components
│           ├── contexts/     # Parent/Student contexts
│           ├── services/     # Parent/Student API services
│           ├── utils/        # Parent/Student utility functions
│           ├── hooks/        # Parent/Student custom hooks
│           ├── screens/      # Parent/Student screens
│           └── config/       # Parent/Student configuration
└── package.json              # Root package configuration
```

## Applications

### Teacher App

- **Bundle ID**: `com.edunovaasia.teacher`
- **Features**:
  - Teacher dashboard and profile
  - Class timetable management
  - Attendance taking
  - BPS (Behavior Point System) management
  - Homework assignment and review
  - Homeroom management
  - Teacher messaging
  - Staff reports

### Parent/Student App

- **Bundle ID**: `com.edunovaasia.parentstudent`
- **Features**:
  - Parent dashboard with multiple student management
  - Student grades and assessments
  - Attendance tracking
  - Assignment viewing
  - Behavior point tracking
  - Student timetable
  - Calendar integration
  - Student messaging
  - Health records
  - Library access

## Development

### Prerequisites

- Node.js 18+
- Expo CLI
- React Native development environment

### Installation

```bash
# Install teacher app dependencies
cd apps/teacher-app
npm install

# Install parent/student app dependencies
cd ../parent-student-app
npm install
```

### Running the Apps

#### Teacher App

```bash
cd apps/teacher-app
npm start
```

#### Parent/Student App

```bash
cd apps/parent-student-app
npm start
```

### Building for Production

#### Teacher App

```bash
cd apps/teacher-app
npm run build:prod
```

#### Parent/Student App

```bash
cd apps/parent-student-app
npm run build:prod
```

## Complete Separation

Each app now contains its own complete copy of all functionality:

- **Contexts**: Theme, Language, Notifications, Messaging (per app)
- **Components**: UI components, forms, charts, etc. (per app)
- **Services**: Authentication, API calls, data management (per app)
- **Utils**: Device detection, styling helpers, validation (per app)
- **Hooks**: Custom React hooks (per app)
- **Screens**: App-specific screens and navigation

## Configuration

Each app has its own:

- Complete source code (components, services, contexts, etc.)
- Firebase configuration
- App icons and splash screens
- Bundle identifiers
- EAS project IDs
- API endpoints and configurations
- Theme and language configurations
- All utilities and helper functions

## Separation Notes

- All screens have been copied to each app individually
- Navigation is configured separately for each app
- Authentication services are duplicated in each app
- Language context is duplicated with full translations in each app
- Asset management is handled per app for branding
- No shared dependencies between apps

## Next Steps

1. Test both apps independently
2. Update Firebase projects for separate apps
3. Configure separate EAS projects
4. Update CI/CD pipelines
5. Create separate app store listings
