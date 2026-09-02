import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithGitHub, signInWithGoogle } = useAuth()

  return (
    <div className="auth-page">
      <h1>Fitness Tracker</h1>
      <p>Sign in to log and track your workouts.</p>
      <div className="oauth-buttons">
        <button type="button" onClick={signInWithGitHub}>
          Sign in with GitHub
        </button>
        <button type="button" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
