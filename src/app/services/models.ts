import { Injectable } from '@angular/core';

export interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface UseCase {
  id: number;
  title: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  date: string;
  tag: string;
}

export interface Model {
  id: number;
  name: string;
  description: string;
  type: string;
  architecture: string;
  benchmarks: string;
  reviews: Review[];
  useCases: UseCase[];
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private models: Model[] = [
    {
      id: 1, name: 'GPT-4', description: 'Advanced reasoning model', type: 'LLM', architecture: 'Transformer', benchmarks: 'MMLU: 86%',
      reviews: [
        { id: 1, author: 'Alex K.', avatar: 'AK', rating: 5, text: 'Incredible reasoning capabilities. Handles complex tasks with ease.', date: '12 Apr 2026' },
        { id: 2, author: 'Maria S.', avatar: 'MS', rating: 4, text: 'Great model but can be slow sometimes. Overall very impressive.', date: '10 Apr 2026' },
        { id: 3, author: 'John D.', avatar: 'JD', rating: 5, text: 'Best LLM I have used so far. Highly recommend for coding tasks.', date: '8 Apr 2026' },
      ],
      useCases: [
        { id: 1, title: 'Built a full-stack app using only GPT-4', author: 'dev_alex', avatar: 'DA', content: 'I used GPT-4 to scaffold an entire Next.js app from scratch. It generated the API routes, database schema, and frontend components. Took me 2 hours instead of 2 days.', likes: 142, date: '11 Apr 2026', tag: 'Coding' },
        { id: 2, title: 'GPT-4 as my legal document reviewer', author: 'lawyer_pro', avatar: 'LP', content: 'Started using GPT-4 to review contracts before sending to clients. It catches ambiguous clauses and suggests improvements. Game changer for solo practitioners.', likes: 89, date: '9 Apr 2026', tag: 'Legal' },
        { id: 3, title: 'Automated customer support with GPT-4', author: 'startup_cto', avatar: 'SC', content: 'Replaced 60% of our tier-1 support tickets with GPT-4. Customer satisfaction actually went up because responses are instant and accurate.', likes: 203, date: '7 Apr 2026', tag: 'Business' },
      ]
    },
    {
      id: 2, name: 'LLaMA 2', description: 'Open-source model', type: 'Open-source', architecture: 'Transformer', benchmarks: 'MMLU: 75%',
      reviews: [
        { id: 1, author: 'Open S.', avatar: 'OS', rating: 4, text: 'Amazing that this is free and open source. Performance is solid.', date: '11 Apr 2026' },
        { id: 2, author: 'Dev M.', avatar: 'DM', rating: 3, text: 'Good but not as powerful as GPT-4. Great for local deployment.', date: '9 Apr 2026' },
      ],
      useCases: [
        { id: 1, title: 'Running LLaMA 2 locally on my MacBook', author: 'ml_enthusiast', avatar: 'ME', content: 'Set up LLaMA 2 13B on my M2 MacBook using Ollama. Runs at ~20 tokens/sec. Perfect for private use cases where I do not want data leaving my machine.', likes: 312, date: '10 Apr 2026', tag: 'Local AI' },
        { id: 2, title: 'Fine-tuned LLaMA 2 for medical QA', author: 'med_researcher', avatar: 'MR', content: 'Fine-tuned LLaMA 2 on medical literature. Achieved 82% accuracy on MedQA benchmark. Open source makes this kind of research accessible.', likes: 156, date: '8 Apr 2026', tag: 'Research' },
      ]
    },
    {
      id: 3, name: 'Mistral', description: 'Fast AI model', type: 'Fast', architecture: 'Transformer', benchmarks: 'MMLU: 78%',
      reviews: [
        { id: 1, author: 'Speed F.', avatar: 'SF', rating: 5, text: 'Incredibly fast inference. Perfect for real-time applications.', date: '10 Apr 2026' },
        { id: 2, author: 'Tech R.', avatar: 'TR', rating: 4, text: 'Great balance of speed and quality. My go-to for production.', date: '8 Apr 2026' },
      ],
      useCases: [
        { id: 1, title: 'Real-time chat assistant with Mistral', author: 'product_builder', avatar: 'PB', content: 'Integrated Mistral into our chat product. Response latency is under 500ms which feels truly real-time. Users love it compared to our previous GPT-3.5 setup.', likes: 178, date: '9 Apr 2026', tag: 'Product' },
        { id: 2, title: 'Mistral for rapid content generation', author: 'content_creator', avatar: 'CC', content: 'Using Mistral to generate first drafts of blog posts. It is 3x faster than other models I tried. Quality is surprisingly good for the speed.', likes: 94, date: '7 Apr 2026', tag: 'Content' },
      ]
    }
  ];

  getAll(): Model[] { return this.models; }

  getById(id: number): Model | undefined {
    return this.models.find(m => m.id === id);
  }

  getSaved(): Model[] {
    const ids = JSON.parse(localStorage.getItem('savedModels') || '[]');
    return this.models.filter(m => ids.includes(m.id));
  }

  toggleSave(id: number): boolean {
    const ids: number[] = JSON.parse(localStorage.getItem('savedModels') || '[]');
    let updated: number[];
    let saved: boolean;
    if (ids.includes(id)) {
      updated = ids.filter(i => i !== id);
      saved = false;
    } else {
      updated = [...ids, id];
      saved = true;
    }
    localStorage.setItem('savedModels', JSON.stringify(updated));
    return saved;
  }

  isSaved(id: number): boolean {
    const ids = JSON.parse(localStorage.getItem('savedModels') || '[]');
    return ids.includes(id);
  }
}
