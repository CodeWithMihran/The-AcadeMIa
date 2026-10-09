export type AuthStackParamList = {
  SignIn: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Subjects: undefined;
  StudyTools: undefined;
  Progress: undefined;
  SubjectProgress: {subjectId: string};
  Rankings: undefined;
  Campus: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
