import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import { Loading, Owner, IssueList, Buttons } from './styles';
import Container from '../../components/Container/index';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    repoName: '',
    filter: 'open',
    loading: true,
    page: 1,
  };

  perPage = 20;

  async componentDidMount() {
    const { match } = this.props;
    const { filter, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues?page=${page}`, {
        params: {
          state: `${filter}`,
          per_page: this.perPage,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      repoName,
      loading: false,
    });
  }

  handleSelectChange = async e => {
    const filter = e.target.value;
    const { repoName } = this.state;

    const issues = await api.get(`/repos/${repoName}/issues?state=${filter}`, {
      params: {
        per_page: this.perPage,
      },
    });

    this.setState({
      issues: issues.data,
      filter,
      page: 1,
    });
  };

  changePage = async btn => {
    const { repoName, filter } = this.state;
    let { page } = this.state;

    if (btn === 'next') {
      page += 1;
    } else {
      page -= 1;
    }

    const issues = await api.get(
      `/repos/${repoName}/issues?state=${filter}&page=${page}`,
      {
        params: {
          per_page: this.perPage,
        },
      }
    );

    this.setState({
      issues: issues.data,
      page,
    });
  };

  render() {
    const { repository, issues, loading, filter, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
          <div>
            <p>Filtrar por:</p>
            <select
              name="filter-state"
              id="filter-state"
              defaultValue={filter}
              onChange={this.handleSelectChange}
            >
              <option value="all">Todas</option>
              <option value="open">Abertas</option>
              <option value="closed">Fechadas</option>
            </select>
          </div>
        </Owner>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Buttons>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => this.changePage('prev')}
          >
            Anterior
          </button>
          <p>Página {page}</p>
          <button
            type="button"
            disabled={issues.length < this.perPage}
            onClick={() => this.changePage('next')}
          >
            Próximo
          </button>
        </Buttons>
      </Container>
    );
  }
}
