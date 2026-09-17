import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-ink-900 sm:text-5xl md:text-6xl">
            <span className="block text-brand-600">AI Interview Coach</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-ink-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Master your interview skills with real-time feedback on confidence, fluency, and technical accuracy.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">Log In</Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-extrabold text-ink-900 text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-12 h-12 mx-auto bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl mb-4">1</div>
              <h3 className="text-lg font-medium text-ink-900">Record</h3>
              <p className="mt-2 text-sm text-ink-500">Record your video response to interview questions.</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl mb-4">2</div>
              <h3 className="text-lg font-medium text-ink-900">Analyse</h3>
              <p className="mt-2 text-sm text-ink-500">Our machine learning models analyse your audio and video.</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl mb-4">3</div>
              <h3 className="text-lg font-medium text-ink-900">Score</h3>
              <p className="mt-2 text-sm text-ink-500">Receive objective scores across multiple dimensions.</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl mb-4">4</div>
              <h3 className="text-lg font-medium text-ink-900">Improve</h3>
              <p className="mt-2 text-sm text-ink-500">Review feedback and practice to improve your performance.</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card title="Confidence Evaluation">
              <p className="text-ink-700">
                Measures your perceived confidence by analyzing vocal energy, pitch variance, and maintaining eye contact.
                Our algorithms extract RMS energy, F0 features, and Eye Aspect Ratio to build a comprehensive confidence profile.
              </p>
            </Card>
            <Card title="Fluency Evaluation">
              <p className="text-ink-700">
                Assesses how smoothly you speak by detecting awkward pauses, filler words, and pacing. 
                Using librosa and silence gating, we provide an objective measure of your conversational flow.
              </p>
            </Card>
            <Card title="Technical Evaluation">
              <p className="text-ink-700">
                Evaluates the accuracy of your answers against a golden standard.
                We use a Siamese bi-encoder and TF-IDF concept graphs to ensure you hit the required technical concepts and complexities.
              </p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
