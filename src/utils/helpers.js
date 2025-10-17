export function getPriorityIcon(priority) {
  const configs = {
    1: { bg: 'bg-red-500', text: 'text-white', icon: '⬆️' },
    2: { bg: 'bg-orange-500', text: 'text-white', icon: '⬆️' },
    3: { bg: 'bg-yellow-400', text: 'text-yellow-900', icon: '➡️' },
    4: { bg: 'bg-gray-400', text: 'text-white', icon: '—' },
    5: { bg: 'bg-green-500', text: 'text-white', icon: '⬇️' },
  };

  const config = configs[priority] || configs[3];
  
  return `
    <div class="priority-icon ${config.bg} ${config.text}">
      <span class="leading-none">${config.icon}</span>
      <span class="ml-0.5">${priority}</span>
    </div>
  `;
}

export function getStatusColor(dataPrazo, isText = false) {
  const today = new Date();
  const prazo = new Date(dataPrazo);
  // Reset time part to compare only dates
  today.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((prazo - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return isText ? 'text-red-600' : 'bg-red-500';
  } else if (diffDays <= 7) {
    return isText ? 'text-orange-600' : 'bg-orange-500';
  } else {
    return isText ? 'text-green-600' : 'bg-green-500';
  }
}

// Novo: Função para obter o badge de status
export function getStatusBadge(status) {
    const statusConfig = {
        'Não Iniciada': 'bg-red-100 text-red-800',
        'Em Andamento': 'bg-blue-100 text-blue-800',
        'Concluída': 'bg-green-100 text-green-800',
    };
    const config = statusConfig[status] || 'bg-gray-100 text-gray-800';
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config}">${status}</span>`;
}


export function formatDate(dateString) {
  if (!dateString) return '';
  // Handles both YYYY-MM-DD and DD/MM/YYYY
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

